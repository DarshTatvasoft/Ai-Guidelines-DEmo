using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskPulse.Domain.Entities;

namespace TaskPulse.Infrastructure.Data.Configurations;

public class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("TaskItems");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Description)
            .HasMaxLength(2000);

        builder.Property(t => t.Position)
            .IsRequired();

        builder.Property(t => t.Priority)
            .IsRequired()
            .HasDefaultValue(Domain.Enums.TaskPriority.Medium);

        builder.Property(t => t.DueDate);

        // Composite index for fast ordering within a column
        builder.HasIndex(t => new { t.ColumnId, t.Position });

        // Soft-delete global query filter
        builder.HasQueryFilter(t => !t.IsDeleted);

        // Many-to-one: TaskItem -> User (Assignee)
        builder.HasOne(t => t.Assignee)
            .WithMany(u => u.AssignedTasks)
            .HasForeignKey(t => t.AssigneeId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

