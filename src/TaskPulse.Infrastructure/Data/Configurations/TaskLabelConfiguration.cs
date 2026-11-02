using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskPulse.Domain.Entities;

namespace TaskPulse.Infrastructure.Data.Configurations;

public class TaskLabelConfiguration : IEntityTypeConfiguration<TaskLabel>
{
    public void Configure(EntityTypeBuilder<TaskLabel> builder)
    {
        builder.ToTable("TaskLabels");

        // Composite primary key
        builder.HasKey(tl => new { tl.TaskItemId, tl.LabelId });

        // Many-to-many: TaskItem <-> Label (via join entity)
        builder.HasOne(tl => tl.TaskItem)
            .WithMany(t => t.TaskLabels)
            .HasForeignKey(tl => tl.TaskItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(tl => tl.Label)
            .WithMany(l => l.TaskLabels)
            .HasForeignKey(tl => tl.LabelId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

