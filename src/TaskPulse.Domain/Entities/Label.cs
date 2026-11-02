using TaskPulse.Domain.Common;

namespace TaskPulse.Domain.Entities;

/// <summary>
/// Represents a tag/label that can be applied to task cards.
/// </summary>
public class Label : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string ColorHex { get; set; } = "#3B82F6";

    // Navigation properties
    public ICollection<TaskLabel> TaskLabels { get; set; } = new List<TaskLabel>();
}

