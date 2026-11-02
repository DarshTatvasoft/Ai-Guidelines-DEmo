using TaskPulse.Domain.Entities;

namespace TaskPulse.Domain.Interfaces;

/// <summary>
/// Repository contract for Column operations within a board.
/// </summary>
public interface IColumnRepository
{
    Task<Column?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IEnumerable<Column>> GetByBoardIdAsync(Guid boardId, CancellationToken cancellationToken = default);

    Task<Column> AddAsync(Column column, CancellationToken cancellationToken = default);

    Task UpdateAsync(Column column, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the count of active (non-deleted) task items in a column.
    /// </summary>
    Task<int> GetTaskCountAsync(Guid columnId, CancellationToken cancellationToken = default);
}

