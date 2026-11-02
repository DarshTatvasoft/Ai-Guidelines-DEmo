using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TaskPulse.Domain.Entities;
using TaskPulse.Infrastructure.Data;
using TaskPulse.Infrastructure.Repositories;
using Xunit;

namespace TaskPulse.Infrastructure.Tests.Repositories;

public class RepositoryTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task BoardRepository_AddAsync_PersistsAndAppliesAuditTimestamps()
    {
        // Arrange
        using var context = CreateDbContext();
        var repo = new BoardRepository(context);

        var board = new Board
        {
            Title = "Sprint Alpha",
            Description = "Initial Sprint"
        };

        // Act
        var result = await repo.AddAsync(board);

        // Assert
        result.Id.Should().NotBeEmpty();
        result.CreatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(2));
        result.IsDeleted.Should().BeFalse();
    }

    [Fact]
    public async Task BoardRepository_DeleteAsync_AppliesSoftDeleteAndQueryFilterHidesIt()
    {
        // Arrange
        using var context = CreateDbContext();
        var repo = new BoardRepository(context);

        var board = new Board { Title = "To Delete" };
        await repo.AddAsync(board);

        // Act
        await repo.DeleteAsync(board.Id);

        // Assert
        var fetched = await repo.GetByIdAsync(board.Id);
        fetched.Should().BeNull(); // Hidden by global query filter

        var rawRecord = await context.Boards.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Id == board.Id);
        rawRecord.Should().NotBeNull();
        rawRecord!.IsDeleted.Should().BeTrue();
        rawRecord.DeletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ColumnRepository_GetTaskCountAsync_CountsOnlyActiveTasks()
    {
        // Arrange
        using var context = CreateDbContext();
        var columnRepo = new ColumnRepository(context);

        var columnId = Guid.NewGuid();
        var activeTask = new TaskItem { Id = Guid.NewGuid(), ColumnId = columnId, Title = "Active" };
        var deletedTask = new TaskItem { Id = Guid.NewGuid(), ColumnId = columnId, Title = "Deleted", IsDeleted = true };

        context.TaskItems.AddRange(activeTask, deletedTask);
        await context.SaveChangesAsync();

        // Act
        var count = await columnRepo.GetTaskCountAsync(columnId);

        // Assert
        count.Should().Be(1);
    }

    [Fact]
    public async Task TaskRepository_UpdatePositionsAsync_AppliesBatchPositions()
    {
        // Arrange
        using var context = CreateDbContext();
        var taskRepo = new TaskRepository(context);

        var columnId = Guid.NewGuid();
        var task1 = new TaskItem { Id = Guid.NewGuid(), ColumnId = columnId, Title = "Task 1", Position = 0 };
        var task2 = new TaskItem { Id = Guid.NewGuid(), ColumnId = columnId, Title = "Task 2", Position = 1 };

        context.TaskItems.AddRange(task1, task2);
        await context.SaveChangesAsync();

        var updates = new List<(Guid TaskId, int NewPosition)>
        {
            (task1.Id, 1),
            (task2.Id, 0)
        };

        // Act
        await taskRepo.UpdatePositionsAsync(columnId, updates);

        // Assert
        var updatedTask1 = await taskRepo.GetByIdAsync(task1.Id);
        var updatedTask2 = await taskRepo.GetByIdAsync(task2.Id);

        updatedTask1!.Position.Should().Be(1);
        updatedTask2!.Position.Should().Be(0);
    }
}

