using TaskPulse.Application.DTOs;

namespace TaskPulse.Application.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<TaskItemDto> AssignTaskUserAsync(Guid taskId, AssignUserDto dto, CancellationToken cancellationToken = default);
}

