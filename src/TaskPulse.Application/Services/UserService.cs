using TaskPulse.Application.DTOs;
using TaskPulse.Application.Exceptions;
using TaskPulse.Application.Interfaces;
using TaskPulse.Domain.Entities;
using TaskPulse.Domain.Interfaces;

namespace TaskPulse.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ITaskRepository _taskRepository;

    public UserService(IUserRepository userRepository, ITaskRepository taskRepository)
    {
        _userRepository = userRepository;
        _taskRepository = taskRepository;
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        return users.Select(u => new UserDto(u.Id, u.FullName, u.Email, u.AvatarUrl));
    }

    public async Task<TaskItemDto> AssignTaskUserAsync(
        Guid taskId,
        AssignUserDto dto,
        CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdWithDetailsAsync(taskId, cancellationToken);
        if (task is null)
        {
            throw new NotFoundException(nameof(TaskItem), taskId);
        }

        if (dto.UserId.HasValue)
        {
            var user = await _userRepository.GetByIdAsync(dto.UserId.Value, cancellationToken);
            if (user is null)
            {
                throw new NotFoundException(nameof(User), dto.UserId.Value);
            }

            task.AssigneeId = user.Id;
            task.Assignee = user;
        }
        else
        {
            task.AssigneeId = null;
            task.Assignee = null;
        }

        await _taskRepository.UpdateAsync(task, cancellationToken);

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

