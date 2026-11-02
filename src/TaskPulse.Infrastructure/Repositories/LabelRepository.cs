using Microsoft.EntityFrameworkCore;
using TaskPulse.Domain.Entities;
using TaskPulse.Domain.Interfaces;
using TaskPulse.Infrastructure.Data;

namespace TaskPulse.Infrastructure.Repositories;

public class LabelRepository : ILabelRepository
{
    private readonly AppDbContext _context;

    public LabelRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Label?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Labels
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Label>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Labels
            .OrderBy(l => l.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Label> AddAsync(Label label, CancellationToken cancellationToken = default)
    {
        await _context.Labels.AddAsync(label, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return label;
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Labels
            .AnyAsync(l => l.Id == id, cancellationToken);
    }

    public async Task<bool> ExistsByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _context.Labels
            .AnyAsync(l => l.Name == name, cancellationToken);
    }
}

