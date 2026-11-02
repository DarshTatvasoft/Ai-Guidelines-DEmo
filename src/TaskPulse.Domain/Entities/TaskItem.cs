using TaskPulse.Domain.Common;
using TaskPulse.Domain.Enums;

namespace TaskPulse.Domain.Entities;

/// <summary>
/// Represents a task card within a column. Contains title, description,
/// priority, position ordering, optional due date, and assignee.
/// </summary>
public class TaskItem : BaseEntity
{
    public Guid ColumnId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int Position { get; set; }

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public DateTimeOffset? DueDate { get; set; }

    public Guid? AssigneeId { get; set; }

    // Navigation properties
    public Column Column { get; set; } = null!;

    public User? Assignee { get; set; }

    public ICollection<TaskLabel> TaskLabels { get; set; } = new List<TaskLabel>();
}

