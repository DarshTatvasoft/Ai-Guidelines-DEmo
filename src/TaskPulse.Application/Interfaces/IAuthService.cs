using TaskPulse.Application.DTOs;

namespace TaskPulse.Application.Interfaces;

public interface IAuthService
{
    Task<TokenResponseDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken = default);

    Task<TokenResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default);

    Task<TokenResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto, CancellationToken cancellationToken = default);
}

