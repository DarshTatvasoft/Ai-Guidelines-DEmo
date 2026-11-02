using TaskPulse.Application.DTOs;

namespace TaskPulse.Application.Interfaces;

public interface ITaskService
{
    Task<TaskItemDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<TaskItemDto> CreateAsync(Guid columnId, CreateTaskDto dto, CancellationToken cancellationToken = default);

    Task<TaskItemDto> UpdateAsync(Guid id, UpdateTaskDto dto, CancellationToken cancellationToken = default);

    Task<TaskItemDto> MoveAsync(Guid id, MoveTaskDto dto, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

