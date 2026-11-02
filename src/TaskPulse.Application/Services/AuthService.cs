using FluentValidation;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Exceptions;
using TaskPulse.Application.Interfaces;
using TaskPulse.Domain.Entities;
using TaskPulse.Domain.Interfaces;

namespace TaskPulse.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IValidator<RegisterDto> _registerValidator;
    private readonly IValidator<LoginDto> _loginValidator;
    private readonly IValidator<RefreshTokenRequestDto> _refreshTokenValidator;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IValidator<RegisterDto> registerValidator,
        IValidator<LoginDto> loginValidator,
        IValidator<RefreshTokenRequestDto> refreshTokenValidator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _registerValidator = registerValidator;
        _loginValidator = loginValidator;
        _refreshTokenValidator = refreshTokenValidator;
    }

    public async Task<TokenResponseDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken = default)
    {
        await _registerValidator.ValidateAndThrowAsync(dto, cancellationToken);

        var emailExists = await _userRepository.ExistsByEmailAsync(dto.Email, cancellationToken);
        if (emailExists)
        {
            throw new ValidationException(new[]
            {
                new FluentValidation.Results.ValidationFailure(nameof(dto.Email), "Email address is already in use.")
            });
        }

        _passwordHasher.CreatePasswordHash(dto.Password, out var hash, out var salt);

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim().ToLowerInvariant(),
            PasswordHash = hash,
            PasswordSalt = salt
        };

        var createdUser = await _userRepository.AddAsync(user, cancellationToken);

        var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(createdUser);
        var refreshToken = _tokenService.GenerateRefreshToken(createdUser.Id);

        await _userRepository.AddRefreshTokenAsync(refreshToken, cancellationToken);

        return new TokenResponseDto(accessToken, refreshToken.Token, expiresAt);
    }

    public async Task<TokenResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default)
    {
        await _loginValidator.ValidateAndThrowAsync(dto, cancellationToken);

        var user = await _userRepository.GetByEmailAsync(dto.Email, cancellationToken);
        if (user is null)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        var isPasswordValid = _passwordHasher.VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt);
        if (!isPasswordValid)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken(user.Id);

        await _userRepository.AddRefreshTokenAsync(refreshToken, cancellationToken);

        return new TokenResponseDto(accessToken, refreshToken.Token, expiresAt);
    }

    public async Task<TokenResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto, CancellationToken cancellationToken = default)
    {
        await _refreshTokenValidator.ValidateAndThrowAsync(dto, cancellationToken);

        var user = await _userRepository.GetByRefreshTokenAsync(dto.RefreshToken, cancellationToken);
        if (user is null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        var existingToken = user.RefreshTokens.FirstOrDefault(rt => rt.Token == dto.RefreshToken);
        if (existingToken is null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        // Reuse detection: If a revoked token is attempted, revoke ALL user refresh tokens immediately
        if (existingToken.RevokedAt != null)
        {
            await _userRepository.RevokeAllUserRefreshTokensAsync(user.Id, cancellationToken);
            throw new UnauthorizedAccessException("Compromised refresh token reused. All active sessions have been terminated.");
        }

        if (existingToken.IsExpired)
        {
            throw new UnauthorizedAccessException("Refresh token has expired. Please log in again.");
        }

        // Single-use token rotation: Revoke current token
        existingToken.RevokedAt = DateTimeOffset.UtcNow;
        await _userRepository.UpdateRefreshTokenAsync(existingToken, cancellationToken);

        // Generate new token pair
        var (newAccessToken, expiresAt) = _tokenService.GenerateAccessToken(user);
        var newRefreshToken = _tokenService.GenerateRefreshToken(user.Id);

        await _userRepository.AddRefreshTokenAsync(newRefreshToken, cancellationToken);

        return new TokenResponseDto(newAccessToken, newRefreshToken.Token, expiresAt);
    }
}

