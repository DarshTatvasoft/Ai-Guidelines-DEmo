namespace TaskPulse.Domain.Common;

/// <summary>
/// Base entity providing primary key, audit fields, and soft-delete support.
/// All domain entities must inherit from this class.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public string? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }
}

