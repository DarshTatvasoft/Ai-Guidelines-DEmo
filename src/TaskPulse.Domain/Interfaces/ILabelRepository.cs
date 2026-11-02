using TaskPulse.Domain.Entities;

namespace TaskPulse.Domain.Interfaces;

/// <summary>
/// Repository contract for Label (tag) operations.
/// </summary>
public interface ILabelRepository
{
    Task<Label?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IEnumerable<Label>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Label> AddAsync(Label label, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> ExistsByNameAsync(string name, CancellationToken cancellationToken = default);
}

