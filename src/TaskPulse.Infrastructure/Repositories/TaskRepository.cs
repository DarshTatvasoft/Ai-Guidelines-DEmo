using Microsoft.EntityFrameworkCore;
using TaskPulse.Domain.Entities;
using TaskPulse.Domain.Interfaces;
using TaskPulse.Infrastructure.Data;

namespace TaskPulse.Infrastructure.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly AppDbContext _context;

    public TaskRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.TaskItems
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<TaskItem?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.TaskItems
            .Include(t => t.Assignee)
            .Include(t => t.TaskLabels)
                .ThenInclude(tl => tl.Label)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<TaskItem>> GetByColumnIdAsync(Guid columnId, CancellationToken cancellationToken = default)
    {
        return await _context.TaskItems
            .Where(t => t.ColumnId == columnId)
            .OrderBy(t => t.Position)
            .Include(t => t.Assignee)
            .Include(t => t.TaskLabels)
                .ThenInclude(tl => tl.Label)
            .ToListAsync(cancellationToken);
    }

    public async Task<TaskItem> AddAsync(TaskItem taskItem, CancellationToken cancellationToken = default)
    {
        await _context.TaskItems.AddAsync(taskItem, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return taskItem;
    }

    public async Task UpdateAsync(TaskItem taskItem, CancellationToken cancellationToken = default)
    {
        _context.TaskItems.Update(taskItem);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var taskItem = await _context.TaskItems
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (taskItem is not null)
        {
            taskItem.IsDeleted = true;
            taskItem.DeletedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.TaskItems
            .AnyAsync(t => t.Id == id, cancellationToken);
    }

    public async Task UpdatePositionsAsync(
        Guid columnId,
        IEnumerable<(Guid TaskId, int NewPosition)> positions,
        CancellationToken cancellationToken = default)
    {
        var taskIds = positions.Select(p => p.TaskId).ToList();
        var tasks = await _context.TaskItems
            .Where(t => t.ColumnId == columnId && taskIds.Contains(t.Id))
            .ToListAsync(cancellationToken);

        foreach (var task in tasks)
        {
            var newPosition = positions.First(p => p.TaskId == task.Id).NewPosition;
            task.Position = newPosition;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}

