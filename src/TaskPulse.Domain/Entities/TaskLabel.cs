namespace TaskPulse.Domain.Entities;

/// <summary>
/// Join entity for the many-to-many relationship between TaskItem and Label.
/// </summary>
public class TaskLabel
{
    public Guid TaskItemId { get; set; }

    public Guid LabelId { get; set; }

    // Navigation properties
    public TaskItem TaskItem { get; set; } = null!;

    public Label Label { get; set; } = null!;
}

