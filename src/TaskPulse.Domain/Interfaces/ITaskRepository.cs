using TaskPulse.Domain.Entities;

namespace TaskPulse.Domain.Interfaces;

/// <summary>
/// Repository contract for TaskItem operations.
/// </summary>
public interface ITaskRepository
{
    Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a task with its labels and assignee eagerly loaded.
    /// </summary>
    Task<TaskItem?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IEnumerable<TaskItem>> GetByColumnIdAsync(Guid columnId, CancellationToken cancellationToken = default);

    Task<TaskItem> AddAsync(TaskItem taskItem, CancellationToken cancellationToken = default);

    Task UpdateAsync(TaskItem taskItem, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates positions for all tasks in the specified column.
    /// Used after move/reorder operations to maintain contiguous indexing.
    /// </summary>
    Task UpdatePositionsAsync(Guid columnId, IEnumerable<(Guid TaskId, int NewPosition)> positions, CancellationToken cancellationToken = default);
}

