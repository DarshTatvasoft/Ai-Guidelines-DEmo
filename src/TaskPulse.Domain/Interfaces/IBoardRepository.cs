using TaskPulse.Domain.Entities;

namespace TaskPulse.Domain.Interfaces;

/// <summary>
/// Repository contract for Board aggregate operations.
/// </summary>
public interface IBoardRepository
{
    Task<Board?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a board with its columns and their task items eagerly loaded.
    /// </summary>
    Task<Board?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IEnumerable<Board>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Board> AddAsync(Board board, CancellationToken cancellationToken = default);

    Task UpdateAsync(Board board, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
}

