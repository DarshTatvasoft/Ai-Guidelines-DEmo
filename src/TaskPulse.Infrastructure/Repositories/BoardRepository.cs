using Microsoft.EntityFrameworkCore;
using TaskPulse.Domain.Entities;
using TaskPulse.Domain.Interfaces;
using TaskPulse.Infrastructure.Data;

namespace TaskPulse.Infrastructure.Repositories;

public class BoardRepository : IBoardRepository
{
    private readonly AppDbContext _context;

    public BoardRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Board?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Boards
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<Board?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Boards
            .Include(b => b.Columns.OrderBy(c => c.Position))
                .ThenInclude(c => c.TaskItems.OrderBy(t => t.Position))
                    .ThenInclude(t => t.Assignee)
            .Include(b => b.Columns)
                .ThenInclude(c => c.TaskItems)
                    .ThenInclude(t => t.TaskLabels)
                        .ThenInclude(tl => tl.Label)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Board>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Boards
            .Include(b => b.Columns)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Board> AddAsync(Board board, CancellationToken cancellationToken = default)
    {
        await _context.Boards.AddAsync(board, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return board;
    }

    public async Task UpdateAsync(Board board, CancellationToken cancellationToken = default)
    {
        _context.Boards.Update(board);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var board = await _context.Boards
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

        if (board is not null)
        {
            board.IsDeleted = true;
            board.DeletedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Boards
            .AnyAsync(b => b.Id == id, cancellationToken);
    }
}

