using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskPulse.Domain.Entities;

namespace TaskPulse.Infrastructure.Data.Configurations;

public class BoardConfiguration : IEntityTypeConfiguration<Board>
{
    public void Configure(EntityTypeBuilder<Board> builder)
    {
        builder.ToTable("Boards");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Title)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(b => b.Description)
            .HasMaxLength(500);

        builder.Property(b => b.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        // Soft-delete global query filter
        builder.HasQueryFilter(b => !b.IsDeleted);

        // One-to-many: Board -> Columns
        builder.HasMany(b => b.Columns)
            .WithOne(c => c.Board)
            .HasForeignKey(c => c.BoardId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

