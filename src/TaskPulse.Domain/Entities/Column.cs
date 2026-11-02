using TaskPulse.Domain.Common;

namespace TaskPulse.Domain.Entities;

/// <summary>
/// Represents a workflow column within a board (e.g., To Do, In Progress, Done).
/// </summary>
public class Column : BaseEntity
{
    public Guid BoardId { get; set; }

    public string Title { get; set; } = string.Empty;

    public int Position { get; set; }

    public string ColorHex { get; set; } = "#64748B";

    public int? WipLimit { get; set; }

    // Navigation properties
    public Board Board { get; set; } = null!;

    public ICollection<TaskItem> TaskItems { get; set; } = new List<TaskItem>();
}

