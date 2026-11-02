using FluentAssertions;
using FluentValidation;
using Moq;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Exceptions;
using TaskPulse.Application.Services;
using TaskPulse.Application.Validators;
using TaskPulse.Domain.Entities;
using TaskPulse.Domain.Enums;
using TaskPulse.Domain.Interfaces;
using Xunit;

namespace TaskPulse.Application.Tests.Services;

public class TaskServiceTests
{
    private readonly Mock<ITaskRepository> _taskRepoMock = new();
    private readonly Mock<IColumnRepository> _columnRepoMock = new();
    private readonly IValidator<CreateTaskDto> _createValidator = new CreateTaskDtoValidator();
    private readonly IValidator<UpdateTaskDto> _updateValidator = new UpdateTaskDtoValidator();
    private readonly IValidator<MoveTaskDto> _moveValidator = new MoveTaskDtoValidator();
    private readonly TaskService _sut;

    public TaskServiceTests()
    {
        _sut = new TaskService(
            _taskRepoMock.Object,
            _columnRepoMock.Object,
            _createValidator,
            _updateValidator,
            _moveValidator);
    }

    [Fact]
    public async Task GetByIdAsync_WhenTaskExists_ReturnsTaskDto()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var task = new TaskItem
        {
            Id = taskId,
            Title = "Task A",
            Position = 0,
            Priority = TaskPriority.High,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _taskRepoMock.Setup(r => r.GetByIdWithDetailsAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        // Act
        var result = await _sut.GetByIdAsync(taskId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(taskId);
        result.Title.Should().Be("Task A");
        result.Priority.Should().Be(TaskPriority.High);
    }

    [Fact]
    public async Task GetByIdAsync_WhenTaskNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        _taskRepoMock.Setup(r => r.GetByIdWithDetailsAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskItem?)null);

        // Act & Assert
        var act = () => _sut.GetByIdAsync(taskId);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task CreateAsync_WhenColumnExists_AppendsTaskAtEndOfColumn()
    {
        // Arrange
        var columnId = Guid.NewGuid();
        var column = new Column { Id = columnId, Title = "To Do", WipLimit = null };
        var dto = new CreateTaskDto("New Task", "Task Description", TaskPriority.Urgent);

        _columnRepoMock.Setup(r => r.GetByIdAsync(columnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(column);
        _columnRepoMock.Setup(r => r.GetTaskCountAsync(columnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(3); // Currently 3 tasks, new task should get position 3

        TaskItem? captured = null;
        _taskRepoMock.Setup(r => r.AddAsync(It.IsAny<TaskItem>(), It.IsAny<CancellationToken>()))
            .Callback<TaskItem, CancellationToken>((t, _) => captured = t)
            .ReturnsAsync((TaskItem t, CancellationToken _) => t);

        // Act
        var result = await _sut.CreateAsync(columnId, dto);

        // Assert
        result.Should().NotBeNull();
        captured.Should().NotBeNull();
        captured!.Position.Should().Be(3);
        captured.Title.Should().Be("New Task");
        captured.Priority.Should().Be(TaskPriority.Urgent);
    }

    [Fact]
    public async Task CreateAsync_WhenWipLimitReached_ThrowsWipLimitExceededException()
    {
        // Arrange
        var columnId = Guid.NewGuid();
        var column = new Column { Id = columnId, Title = "In Progress", WipLimit = 2 };
        var dto = new CreateTaskDto("Task Exceeding WIP", null);

        _columnRepoMock.Setup(r => r.GetByIdAsync(columnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(column);
        _columnRepoMock.Setup(r => r.GetTaskCountAsync(columnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(2); // At WIP limit (2 of 2)

        // Act & Assert
        var act = () => _sut.CreateAsync(columnId, dto);
        await act.Should().ThrowAsync<WipLimitExceededException>()
            .WithMessage($"*{columnId}*");
    }

    [Fact]
    public async Task MoveAsync_SameColumn_ReordersContiguously()
    {
        // Arrange
        var columnId = Guid.NewGuid();
        var task0 = new TaskItem { Id = Guid.NewGuid(), ColumnId = columnId, Position = 0, Title = "Task 0" };
        var task1 = new TaskItem { Id = Guid.NewGuid(), ColumnId = columnId, Position = 1, Title = "Task 1" };
        var task2 = new TaskItem { Id = Guid.NewGuid(), ColumnId = columnId, Position = 2, Title = "Task 2" };

        var column = new Column { Id = columnId, Title = "To Do" };

        // Moving task0 from position 0 to position 2
        var moveDto = new MoveTaskDto(columnId, 2);

        _taskRepoMock.Setup(r => r.GetByIdWithDetailsAsync(task0.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task0);
        _columnRepoMock.Setup(r => r.GetByIdAsync(columnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(column);
        _taskRepoMock.Setup(r => r.GetByColumnIdAsync(columnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TaskItem> { task0, task1, task2 });

        List<(Guid TaskId, int NewPosition)>? capturedUpdates = null;
        _taskRepoMock.Setup(r => r.UpdatePositionsAsync(columnId, It.IsAny<IEnumerable<(Guid, int)>>(), It.IsAny<CancellationToken>()))
            .Callback<Guid, IEnumerable<(Guid, int)>, CancellationToken>((_, updates, _) => capturedUpdates = updates.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.MoveAsync(task0.Id, moveDto);

        // Assert
        result.Should().NotBeNull();
        capturedUpdates.Should().NotBeNull();
        // After move: task1 (pos 0), task2 (pos 1), task0 (pos 2)
        capturedUpdates!.First(u => u.TaskId == task1.Id).NewPosition.Should().Be(0);
        capturedUpdates!.First(u => u.TaskId == task2.Id).NewPosition.Should().Be(1);
        capturedUpdates!.First(u => u.TaskId == task0.Id).NewPosition.Should().Be(2);
    }

    [Fact]
    public async Task MoveAsync_CrossColumn_RebalancesBothSourceAndTargetColumns()
    {
        // Arrange
        var sourceColumnId = Guid.NewGuid();
        var targetColumnId = Guid.NewGuid();

        var movingTask = new TaskItem { Id = Guid.NewGuid(), ColumnId = sourceColumnId, Position = 0, Title = "Moving Task" };
        var remainingSourceTask = new TaskItem { Id = Guid.NewGuid(), ColumnId = sourceColumnId, Position = 1, Title = "Remaining Task" };

        var existingTargetTask = new TaskItem { Id = Guid.NewGuid(), ColumnId = targetColumnId, Position = 0, Title = "Target Existing Task" };

        var targetColumn = new Column { Id = targetColumnId, Title = "Done", WipLimit = 5 };

        var moveDto = new MoveTaskDto(targetColumnId, 0); // Move to head of target column

        _taskRepoMock.Setup(r => r.GetByIdWithDetailsAsync(movingTask.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(movingTask);
        _columnRepoMock.Setup(r => r.GetByIdAsync(targetColumnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(targetColumn);
        _columnRepoMock.Setup(r => r.GetTaskCountAsync(targetColumnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _taskRepoMock.Setup(r => r.GetByColumnIdAsync(sourceColumnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TaskItem> { movingTask, remainingSourceTask });
        _taskRepoMock.Setup(r => r.GetByColumnIdAsync(targetColumnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TaskItem> { existingTargetTask });

        List<(Guid TaskId, int NewPosition)>? sourceUpdates = null;
        List<(Guid TaskId, int NewPosition)>? targetUpdates = null;

        _taskRepoMock.Setup(r => r.UpdatePositionsAsync(sourceColumnId, It.IsAny<IEnumerable<(Guid, int)>>(), It.IsAny<CancellationToken>()))
            .Callback<Guid, IEnumerable<(Guid, int)>, CancellationToken>((_, u, _) => sourceUpdates = u.ToList())
            .Returns(Task.CompletedTask);

        _taskRepoMock.Setup(r => r.UpdatePositionsAsync(targetColumnId, It.IsAny<IEnumerable<(Guid, int)>>(), It.IsAny<CancellationToken>()))
            .Callback<Guid, IEnumerable<(Guid, int)>, CancellationToken>((_, u, _) => targetUpdates = u.ToList())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.MoveAsync(movingTask.Id, moveDto);

        // Assert
        result.Should().NotBeNull();
        movingTask.ColumnId.Should().Be(targetColumnId);
        movingTask.Position.Should().Be(0);

        // Source column rebalanced: remaining task moved from pos 1 to pos 0
        sourceUpdates.Should().ContainSingle(u => u.TaskId == remainingSourceTask.Id && u.NewPosition == 0);

        // Target column: movingTask is at pos 0, existingTargetTask shifted to pos 1
        targetUpdates.Should().HaveCount(2);
        targetUpdates!.First(u => u.TaskId == movingTask.Id).NewPosition.Should().Be(0);
        targetUpdates!.First(u => u.TaskId == existingTargetTask.Id).NewPosition.Should().Be(1);
    }

    [Fact]
    public async Task MoveAsync_CrossColumn_WhenTargetWipLimitExceeded_ThrowsWipLimitExceededException()
    {
        // Arrange
        var sourceColumnId = Guid.NewGuid();
        var targetColumnId = Guid.NewGuid();

        var movingTask = new TaskItem { Id = Guid.NewGuid(), ColumnId = sourceColumnId, Position = 0 };
        var targetColumn = new Column { Id = targetColumnId, Title = "Done", WipLimit = 2 };

        _taskRepoMock.Setup(r => r.GetByIdWithDetailsAsync(movingTask.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(movingTask);
        _columnRepoMock.Setup(r => r.GetByIdAsync(targetColumnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(targetColumn);
        _columnRepoMock.Setup(r => r.GetTaskCountAsync(targetColumnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(2); // Target column already at limit

        var moveDto = new MoveTaskDto(targetColumnId, 0);

        // Act & Assert
        var act = () => _sut.MoveAsync(movingTask.Id, moveDto);
        await act.Should().ThrowAsync<WipLimitExceededException>();
    }

    [Fact]
    public async Task DeleteAsync_WhenTaskExists_DeletesAndRebalancesRemainingTasks()
    {
        // Arrange
        var columnId = Guid.NewGuid();
        var taskToDelete = new TaskItem { Id = Guid.NewGuid(), ColumnId = columnId, Position = 0 };
        var task2 = new TaskItem { Id = Guid.NewGuid(), ColumnId = columnId, Position = 1 };

        _taskRepoMock.Setup(r => r.GetByIdAsync(taskToDelete.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(taskToDelete);
        _taskRepoMock.Setup(r => r.GetByColumnIdAsync(columnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TaskItem> { task2 });

        List<(Guid TaskId, int NewPosition)>? capturedUpdates = null;
        _taskRepoMock.Setup(r => r.UpdatePositionsAsync(columnId, It.IsAny<IEnumerable<(Guid, int)>>(), It.IsAny<CancellationToken>()))
            .Callback<Guid, IEnumerable<(Guid, int)>, CancellationToken>((_, u, _) => capturedUpdates = u.ToList())
            .Returns(Task.CompletedTask);

        // Act
        await _sut.DeleteAsync(taskToDelete.Id);

        // Assert
        _taskRepoMock.Verify(r => r.DeleteAsync(taskToDelete.Id, It.IsAny<CancellationToken>()), Times.Once);
        capturedUpdates.Should().ContainSingle(u => u.TaskId == task2.Id && u.NewPosition == 0);
    }

    [Fact]
    public async Task DeleteAsync_WhenTaskNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        _taskRepoMock.Setup(r => r.GetByIdAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskItem?)null);

        // Act & Assert
        var act = () => _sut.DeleteAsync(taskId);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task UpdateAsync_WhenTaskExists_UpdatesFieldsAndLabels()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var labelId = Guid.NewGuid();
        var task = new TaskItem
        {
            Id = taskId,
            Title = "Old Title",
            Description = "Old Desc",
            Priority = TaskPriority.Low,
            TaskLabels = new List<TaskLabel>()
        };

        var updateDto = new UpdateTaskDto(
            "Updated Title",
            "Updated Desc",
            TaskPriority.Urgent,
            DateTimeOffset.UtcNow.AddDays(2),
            Guid.NewGuid(),
            new List<Guid> { labelId });

        _taskRepoMock.Setup(r => r.GetByIdWithDetailsAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        // Act
        var result = await _sut.UpdateAsync(taskId, updateDto);

        // Assert
        result.Should().NotBeNull();
        task.Title.Should().Be("Updated Title");
        task.Description.Should().Be("Updated Desc");
        task.Priority.Should().Be(TaskPriority.Urgent);
        task.TaskLabels.Should().HaveCount(1);
        _taskRepoMock.Verify(r => r.UpdateAsync(task, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenTaskNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var updateDto = new UpdateTaskDto("Title", null, TaskPriority.Low, null, null, null);

        _taskRepoMock.Setup(r => r.GetByIdWithDetailsAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskItem?)null);

        // Act & Assert
        var act = () => _sut.UpdateAsync(taskId, updateDto);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task CreateAsync_WithLabelIds_AssociatesLabels()
    {
        // Arrange
        var columnId = Guid.NewGuid();
        var labelId = Guid.NewGuid();
        var column = new Column { Id = columnId, Title = "To Do" };
        var dto = new CreateTaskDto("Tagged Task", null, TaskPriority.Medium, null, null, new List<Guid> { labelId });

        _columnRepoMock.Setup(r => r.GetByIdAsync(columnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(column);
        _columnRepoMock.Setup(r => r.GetTaskCountAsync(columnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        TaskItem? captured = null;
        _taskRepoMock.Setup(r => r.AddAsync(It.IsAny<TaskItem>(), It.IsAny<CancellationToken>()))
            .Callback<TaskItem, CancellationToken>((t, _) => captured = t)
            .ReturnsAsync((TaskItem t, CancellationToken _) => t);

        // Act
        var result = await _sut.CreateAsync(columnId, dto);

        // Assert
        result.Should().NotBeNull();
        captured.Should().NotBeNull();
        captured!.TaskLabels.Should().ContainSingle(tl => tl.LabelId == labelId);
    }

    [Fact]
    public async Task CreateAsync_WhenColumnNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var columnId = Guid.NewGuid();
        var dto = new CreateTaskDto("Task Title", null);

        _columnRepoMock.Setup(r => r.GetByIdAsync(columnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Column?)null);

        // Act & Assert
        var act = () => _sut.CreateAsync(columnId, dto);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task MoveAsync_WhenTaskNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var moveDto = new MoveTaskDto(Guid.NewGuid(), 0);

        _taskRepoMock.Setup(r => r.GetByIdWithDetailsAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskItem?)null);

        // Act & Assert
        var act = () => _sut.MoveAsync(taskId, moveDto);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task MoveAsync_WhenTargetColumnNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var targetColumnId = Guid.NewGuid();
        var task = new TaskItem { Id = taskId, ColumnId = Guid.NewGuid() };
        var moveDto = new MoveTaskDto(targetColumnId, 0);

        _taskRepoMock.Setup(r => r.GetByIdWithDetailsAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _columnRepoMock.Setup(r => r.GetByIdAsync(targetColumnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Column?)null);

        // Act & Assert
        var act = () => _sut.MoveAsync(taskId, moveDto);
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
