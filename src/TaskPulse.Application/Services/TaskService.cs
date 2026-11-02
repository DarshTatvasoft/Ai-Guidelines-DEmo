using FluentValidation;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Exceptions;
using TaskPulse.Application.Interfaces;
using TaskPulse.Domain.Entities;
using TaskPulse.Domain.Interfaces;

namespace TaskPulse.Application.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IColumnRepository _columnRepository;
    private readonly IValidator<CreateTaskDto> _createTaskValidator;
    private readonly IValidator<UpdateTaskDto> _updateTaskValidator;
    private readonly IValidator<MoveTaskDto> _moveTaskValidator;

    public TaskService(
        ITaskRepository taskRepository,
        IColumnRepository columnRepository,
        IValidator<CreateTaskDto> createTaskValidator,
        IValidator<UpdateTaskDto> updateTaskValidator,
        IValidator<MoveTaskDto> moveTaskValidator)
    {
        _taskRepository = taskRepository;
        _columnRepository = columnRepository;
        _createTaskValidator = createTaskValidator;
        _updateTaskValidator = updateTaskValidator;
        _moveTaskValidator = moveTaskValidator;
    }

    public async Task<TaskItemDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdWithDetailsAsync(id, cancellationToken);
        if (task is null)
        {
            throw new NotFoundException(nameof(TaskItem), id);
        }

        return MapToDto(task);
    }

    public async Task<TaskItemDto> CreateAsync(
        Guid columnId,
        CreateTaskDto dto,
        CancellationToken cancellationToken = default)
    {
        await _createTaskValidator.ValidateAndThrowAsync(dto, cancellationToken);

        var column = await _columnRepository.GetByIdAsync(columnId, cancellationToken);
        if (column is null)
        {
            throw new NotFoundException(nameof(Column), columnId);
        }

        var currentCount = await _columnRepository.GetTaskCountAsync(columnId, cancellationToken);
        if (column.WipLimit.HasValue && currentCount >= column.WipLimit.Value)
        {
            throw new WipLimitExceededException(columnId, column.WipLimit.Value);
        }

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            ColumnId = columnId,
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            Position = currentCount,
            Priority = dto.Priority,
            DueDate = dto.DueDate,
            AssigneeId = dto.AssigneeId
        };

        if (dto.LabelIds is { Count: > 0 })
        {
            task.TaskLabels = dto.LabelIds.Select(labelId => new TaskLabel
            {
                TaskItemId = task.Id,
                LabelId = labelId
            }).ToList();
        }

        var created = await _taskRepository.AddAsync(task, cancellationToken);
        return MapToDto(created);
    }

    public async Task<TaskItemDto> UpdateAsync(
        Guid id,
        UpdateTaskDto dto,
        CancellationToken cancellationToken = default)
    {
        await _updateTaskValidator.ValidateAndThrowAsync(dto, cancellationToken);

        var task = await _taskRepository.GetByIdWithDetailsAsync(id, cancellationToken);
        if (task is null)
        {
            throw new NotFoundException(nameof(TaskItem), id);
        }

        task.Title = dto.Title.Trim();
        task.Description = dto.Description?.Trim();
        task.Priority = dto.Priority;
        task.DueDate = dto.DueDate;
        task.AssigneeId = dto.AssigneeId;

        if (dto.LabelIds is not null)
        {
            task.TaskLabels = dto.LabelIds.Select(labelId => new TaskLabel
            {
                TaskItemId = task.Id,
                LabelId = labelId
            }).ToList();
        }

        await _taskRepository.UpdateAsync(task, cancellationToken);
        return MapToDto(task);
    }

    public async Task<TaskItemDto> MoveAsync(
        Guid id,
        MoveTaskDto dto,
        CancellationToken cancellationToken = default)
    {
        await _moveTaskValidator.ValidateAndThrowAsync(dto, cancellationToken);

        var task = await _taskRepository.GetByIdWithDetailsAsync(id, cancellationToken);
        if (task is null)
        {
            throw new NotFoundException(nameof(TaskItem), id);
        }

        var sourceColumnId = task.ColumnId;
        var targetColumnId = dto.TargetColumnId;

        var targetColumn = await _columnRepository.GetByIdAsync(targetColumnId, cancellationToken);
        if (targetColumn is null)
        {
            throw new NotFoundException(nameof(Column), targetColumnId);
        }

        if (sourceColumnId == targetColumnId)
        {
            // Same column reorder
            var existingTasks = (await _taskRepository.GetByColumnIdAsync(sourceColumnId, cancellationToken))
                .OrderBy(t => t.Position)
                .ToList();

            var currentTask = existingTasks.FirstOrDefault(t => t.Id == id) ?? task;
            existingTasks.Remove(currentTask);

            var clampedPosition = Math.Clamp(dto.NewPosition, 0, existingTasks.Count);
            existingTasks.Insert(clampedPosition, currentTask);

            var updates = existingTasks.Select((t, idx) => (t.Id, NewPosition: idx)).ToList();
            await _taskRepository.UpdatePositionsAsync(sourceColumnId, updates, cancellationToken);

            currentTask.Position = clampedPosition;
            return MapToDto(currentTask);
        }
        else
        {
            // Cross column move - check WIP limit on target column
            if (targetColumn.WipLimit.HasValue)
            {
                var targetCount = await _columnRepository.GetTaskCountAsync(targetColumnId, cancellationToken);
                if (targetCount >= targetColumn.WipLimit.Value)
                {
                    throw new WipLimitExceededException(targetColumnId, targetColumn.WipLimit.Value);
                }
            }

            // 1. Rebalance source column (remove task)
            var sourceTasks = (await _taskRepository.GetByColumnIdAsync(sourceColumnId, cancellationToken))
                .Where(t => t.Id != id)
                .OrderBy(t => t.Position)
                .ToList();

            var sourceUpdates = sourceTasks.Select((t, idx) => (t.Id, NewPosition: idx)).ToList();
            await _taskRepository.UpdatePositionsAsync(sourceColumnId, sourceUpdates, cancellationToken);

            // 2. Insert into target column at clamped position
            var targetTasks = (await _taskRepository.GetByColumnIdAsync(targetColumnId, cancellationToken))
                .OrderBy(t => t.Position)
                .ToList();

            var clampedPosition = Math.Clamp(dto.NewPosition, 0, targetTasks.Count);
            task.ColumnId = targetColumnId;
            task.Position = clampedPosition;
            targetTasks.Insert(clampedPosition, task);

            var targetUpdates = targetTasks.Select((t, idx) => (t.Id, NewPosition: idx)).ToList();
            await _taskRepository.UpdatePositionsAsync(targetColumnId, targetUpdates, cancellationToken);
            await _taskRepository.UpdateAsync(task, cancellationToken);

            return MapToDto(task);
        }
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdAsync(id, cancellationToken);
        if (task is null)
        {
            throw new NotFoundException(nameof(TaskItem), id);
        }

        var columnId = task.ColumnId;
        await _taskRepository.DeleteAsync(id, cancellationToken);

        // Rebalance remaining tasks in column to maintain contiguous indexing
        var remainingTasks = (await _taskRepository.GetByColumnIdAsync(columnId, cancellationToken))
            .Where(t => t.Id != id)
            .OrderBy(t => t.Position)
            .ToList();

        var updates = remainingTasks.Select((t, idx) => (t.Id, NewPosition: idx)).ToList();
        await _taskRepository.UpdatePositionsAsync(columnId, updates, cancellationToken);
    }

    private static TaskItemDto MapToDto(TaskItem task)
    {
        var labelDtos = task.TaskLabels
            .Where(tl => tl.Label is not null)
            .Select(tl => new LabelDto(tl.Label.Id, tl.Label.Name, tl.Label.ColorHex))
            .ToList();

        return new TaskItemDto(
            task.Id,
            task.ColumnId,
            task.Title,
            task.Description,
            task.Position,
            task.Priority,
            task.DueDate,
            task.AssigneeId,
            task.Assignee?.FullName,
            labelDtos,
            task.CreatedAt);
    }
}

