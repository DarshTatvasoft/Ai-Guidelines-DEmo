using TaskPulse.Domain.Common;

namespace TaskPulse.Domain.Entities;

/// <summary>
/// Represents a Kanban board containing one or more columns.
/// </summary>
public class Board : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public ICollection<Column> Columns { get; set; } = new List<Column>();
}

