namespace TaskPulse.Application.DTOs;

public record RegisterDto(
    string FullName,
    string Email,
    string Password);

public record LoginDto(
    string Email,
    string Password);

public record TokenResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset ExpiresAt);

public record RefreshTokenRequestDto(
    string RefreshToken);

