namespace TaskPulse.Application.Exceptions;

public class WipLimitExceededException : Exception
{
    public Guid ColumnId { get; }
    public int WipLimit { get; }

    public WipLimitExceededException(Guid columnId, int wipLimit)
        : base($"Cannot move task to column '{columnId}'. The column has reached its WIP limit of {wipLimit} tasks.")
    {
        ColumnId = columnId;
        WipLimit = wipLimit;
    }
}

