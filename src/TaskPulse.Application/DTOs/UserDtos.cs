namespace TaskPulse.Application.DTOs;

public record UserDto(
    Guid Id,
    string FullName,
    string Email,
    string? AvatarUrl);

public record AssignUserDto(
    Guid? UserId);

