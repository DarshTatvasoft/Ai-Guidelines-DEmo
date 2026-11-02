using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskPulse.Domain.Entities;

namespace TaskPulse.Infrastructure.Data.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");

        builder.HasKey(rt => rt.Id);

        builder.Property(rt => rt.Token)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(rt => rt.ExpiresAt)
            .IsRequired();

        builder.Property(rt => rt.RevokedAt);

        // Ignore computed properties so EF Core does not map them to database columns
        builder.Ignore(rt => rt.IsExpired);
        builder.Ignore(rt => rt.IsActive);

        // Unique index on Token for fast lookup during session rotation
        builder.HasIndex(rt => rt.Token)
            .IsUnique();

        // Index on UserId for querying user sessions
        builder.HasIndex(rt => rt.UserId);

        // Soft-delete global query filter
        builder.HasQueryFilter(rt => !rt.IsDeleted);

        // Many-to-one: RefreshToken -> User
        builder.HasOne(rt => rt.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

