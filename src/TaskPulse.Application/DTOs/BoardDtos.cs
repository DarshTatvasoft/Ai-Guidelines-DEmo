using TaskPulse.Domain.Enums;

namespace TaskPulse.Application.DTOs;

public record LabelDto(
    Guid Id,
    string Name,
    string ColorHex);

public record TaskItemDto(
    Guid Id,
    Guid ColumnId,
    string Title,
    string? Description,
    int Position,
    TaskPriority Priority,
    DateTimeOffset? DueDate,
    Guid? AssigneeId,
    string? AssigneeName,
    List<LabelDto> Labels,
    DateTimeOffset CreatedAt);

public record CreateTaskDto(
    string Title,
    string? Description,
    TaskPriority Priority = TaskPriority.Medium,
    DateTimeOffset? DueDate = null,
    Guid? AssigneeId = null,
    List<Guid>? LabelIds = null);

public record UpdateTaskDto(
    string Title,
    string? Description,
    TaskPriority Priority,
    DateTimeOffset? DueDate,
    Guid? AssigneeId,
    List<Guid>? LabelIds);

public record MoveTaskDto(
    Guid TargetColumnId,
    int NewPosition);

public record ColumnDto(
    Guid Id,
    Guid BoardId,
    string Title,
    int Position,
    string ColorHex,
    int? WipLimit,
    List<TaskItemDto> Tasks);

public record CreateColumnDto(
    string Title,
    string? ColorHex = "#64748B",
    int? WipLimit = null);

public record UpdateColumnDto(
    string Title,
    string ColorHex,
    int? WipLimit);

public record BoardSummaryDto(
    Guid Id,
    string Title,
    string? Description,
    bool IsActive,
    int ColumnCount,
    int TaskCount,
    DateTimeOffset CreatedAt);

public record BoardDetailDto(
    Guid Id,
    string Title,
    string? Description,
    bool IsActive,
    DateTimeOffset CreatedAt,
    List<ColumnDto> Columns);

public record CreateBoardDto(
    string Title,
    string? Description = null);

