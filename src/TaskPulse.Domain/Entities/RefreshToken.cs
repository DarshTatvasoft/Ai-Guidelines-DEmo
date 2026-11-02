using TaskPulse.Domain.Common;

namespace TaskPulse.Domain.Entities;

/// <summary>
/// Represents a persistent refresh token used for rotating JWT authentication sessions.
/// </summary>
public class RefreshToken : BaseEntity
{
    public string Token { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? RevokedAt { get; set; }

    public Guid UserId { get; set; }

    // Computed properties
    public bool IsExpired => DateTimeOffset.UtcNow >= ExpiresAt;

    public bool IsActive => RevokedAt == null && !IsExpired;

    // Navigation property
    public User User { get; set; } = null!;
}

