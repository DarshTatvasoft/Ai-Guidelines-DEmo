using TaskPulse.Domain.Common;

namespace TaskPulse.Domain.Entities;

/// <summary>
/// Represents an authenticated user who can own boards, create tasks, and be assigned cards.
/// </summary>
public class User : BaseEntity
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public byte[] PasswordHash { get; set; } = Array.Empty<byte>();

    public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();

    public string? AvatarUrl { get; set; }

    // Navigation properties
    public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
