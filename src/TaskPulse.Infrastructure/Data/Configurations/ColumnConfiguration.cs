using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskPulse.Domain.Entities;

namespace TaskPulse.Infrastructure.Data.Configurations;

public class ColumnConfiguration : IEntityTypeConfiguration<Column>
{
    public void Configure(EntityTypeBuilder<Column> builder)
    {
        builder.ToTable("Columns");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Title)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.Position)
            .IsRequired();

        builder.Property(c => c.ColorHex)
            .IsRequired()
            .HasMaxLength(7)
            .HasDefaultValue("#64748B");

        builder.Property(c => c.WipLimit);

        // Composite index for fast ordering within a board
        builder.HasIndex(c => new { c.BoardId, c.Position });

        // Soft-delete global query filter
        builder.HasQueryFilter(c => !c.IsDeleted);

        // One-to-many: Column -> TaskItems
        builder.HasMany(c => c.TaskItems)
            .WithOne(t => t.Column)
            .HasForeignKey(t => t.ColumnId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

