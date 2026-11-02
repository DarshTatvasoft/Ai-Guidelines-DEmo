using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskPulse.Domain.Entities;

namespace TaskPulse.Infrastructure.Data.Configurations;

public class LabelConfiguration : IEntityTypeConfiguration<Label>
{
    public void Configure(EntityTypeBuilder<Label> builder)
    {
        builder.ToTable("Labels");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Name)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(l => l.ColorHex)
            .IsRequired()
            .HasMaxLength(7)
            .HasDefaultValue("#3B82F6");

        // Unique constraint on label name
        builder.HasIndex(l => l.Name)
            .IsUnique();

        // Soft-delete global query filter
        builder.HasQueryFilter(l => !l.IsDeleted);
    }
}

