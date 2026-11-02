using Microsoft.EntityFrameworkCore;
using TaskPulse.Domain.Entities;
using TaskPulse.Domain.Interfaces;
using TaskPulse.Infrastructure.Data;

namespace TaskPulse.Infrastructure.Repositories;

public class ColumnRepository : IColumnRepository
{
    private readonly AppDbContext _context;

    public ColumnRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Column?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Columns
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Column>> GetByBoardIdAsync(Guid boardId, CancellationToken cancellationToken = default)
    {
        return await _context.Columns
            .Where(c => c.BoardId == boardId)
            .OrderBy(c => c.Position)
            .Include(c => c.TaskItems.OrderBy(t => t.Position))
            .ToListAsync(cancellationToken);
    }

    public async Task<Column> AddAsync(Column column, CancellationToken cancellationToken = default)
    {
        await _context.Columns.AddAsync(column, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return column;
    }

    public async Task UpdateAsync(Column column, CancellationToken cancellationToken = default)
    {
        _context.Columns.Update(column);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var column = await _context.Columns
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (column is not null)
        {
            column.IsDeleted = true;
            column.DeletedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Columns
            .AnyAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<int> GetTaskCountAsync(Guid columnId, CancellationToken cancellationToken = default)
    {
        return await _context.TaskItems
            .CountAsync(t => t.ColumnId == columnId, cancellationToken);
    }
}

