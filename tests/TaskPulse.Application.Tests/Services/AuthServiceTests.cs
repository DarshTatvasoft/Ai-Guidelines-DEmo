using FluentAssertions;
using FluentValidation;
using Moq;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Interfaces;
using TaskPulse.Application.Services;
using TaskPulse.Application.Validators;
using TaskPulse.Domain.Entities;
using TaskPulse.Domain.Interfaces;
using Xunit;

namespace TaskPulse.Application.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IPasswordHasher> _hasherMock = new();
    private readonly Mock<ITokenService> _tokenServiceMock = new();
    private readonly IValidator<RegisterDto> _registerValidator = new RegisterDtoValidator();
    private readonly IValidator<LoginDto> _loginValidator = new LoginDtoValidator();
    private readonly IValidator<RefreshTokenRequestDto> _refreshTokenValidator = new RefreshTokenRequestDtoValidator();
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _sut = new AuthService(
            _userRepoMock.Object,
            _hasherMock.Object,
            _tokenServiceMock.Object,
            _registerValidator,
            _loginValidator,
            _refreshTokenValidator);
    }

    [Fact]
    public async Task RegisterAsync_WithValidDto_ReturnsTokensAndStoresUser()
    {
        // Arrange
        var dto = new RegisterDto("Jane Doe", "jane@example.com", "SecureP@ssw0rd1");
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = dto.Email, FullName = dto.FullName };

        _userRepoMock.Setup(r => r.ExistsByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _userRepoMock.Setup(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var hash = new byte[64];
        var salt = new byte[128];
        _hasherMock.Setup(h => h.CreatePasswordHash(dto.Password, out hash, out salt));

        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(15);
        _tokenServiceMock.Setup(t => t.GenerateAccessToken(user))
            .Returns(("jwt-access-token", expiresAt));
        _tokenServiceMock.Setup(t => t.GenerateRefreshToken(userId))
            .Returns(new RefreshToken { Id = Guid.NewGuid(), UserId = userId, Token = "refresh-token-123", ExpiresAt = DateTimeOffset.UtcNow.AddDays(7) });

        // Act
        var result = await _sut.RegisterAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("jwt-access-token");
        result.RefreshToken.Should().Be("refresh-token-123");
        result.ExpiresAt.Should().Be(expiresAt);

        _userRepoMock.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
        _userRepoMock.Verify(r => r.AddRefreshTokenAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WhenEmailAlreadyExists_ThrowsValidationException()
    {
        // Arrange
        var dto = new RegisterDto("Jane Doe", "existing@example.com", "SecureP@ssw0rd1");

        _userRepoMock.Setup(r => r.ExistsByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act & Assert
        var act = () => _sut.RegisterAsync(dto);
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*already in use*");
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsTokens()
    {
        // Arrange
        var dto = new LoginDto("user@example.com", "P@ssword123");
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = dto.Email,
            PasswordHash = new byte[] { 1, 2, 3 },
            PasswordSalt = new byte[] { 4, 5, 6 }
        };

        _userRepoMock.Setup(r => r.GetByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _hasherMock.Setup(h => h.VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
            .Returns(true);

        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(15);
        _tokenServiceMock.Setup(t => t.GenerateAccessToken(user))
            .Returns(("new-jwt", expiresAt));
        _tokenServiceMock.Setup(t => t.GenerateRefreshToken(userId))
            .Returns(new RefreshToken { Token = "new-refresh", UserId = userId, ExpiresAt = DateTimeOffset.UtcNow.AddDays(7) });

        // Act
        var result = await _sut.LoginAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("new-jwt");
        result.RefreshToken.Should().Be("new-refresh");
    }

    [Fact]
    public async Task LoginAsync_WhenUserNotFound_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var dto = new LoginDto("nonexistent@example.com", "P@ssword123");
        _userRepoMock.Setup(r => r.GetByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act & Assert
        var act = () => _sut.LoginAsync(dto);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Invalid email or password*");
    }

    [Fact]
    public async Task LoginAsync_WhenPasswordIncorrect_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var dto = new LoginDto("user@example.com", "WrongPassword");
        var user = new User { Email = dto.Email, PasswordHash = new byte[] { 1 }, PasswordSalt = new byte[] { 2 } };

        _userRepoMock.Setup(r => r.GetByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _hasherMock.Setup(h => h.VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
            .Returns(false);

        // Act & Assert
        var act = () => _sut.LoginAsync(dto);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Invalid email or password*");
    }

    [Fact]
    public async Task RefreshTokenAsync_WithValidToken_RotatesTokenAndReturnsNewPair()
    {
        // Arrange
        var oldToken = "valid-old-refresh-token";
        var dto = new RefreshTokenRequestDto(oldToken);
        var userId = Guid.NewGuid();
        var existingRefreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = oldToken,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(5),
            RevokedAt = null
        };

        var user = new User
        {
            Id = userId,
            Email = "user@test.com",
            RefreshTokens = new List<RefreshToken> { existingRefreshToken }
        };

        _userRepoMock.Setup(r => r.GetByRefreshTokenAsync(oldToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(15);
        _tokenServiceMock.Setup(t => t.GenerateAccessToken(user))
            .Returns(("rotated-jwt", expiresAt));
        _tokenServiceMock.Setup(t => t.GenerateRefreshToken(userId))
            .Returns(new RefreshToken { Token = "rotated-refresh", UserId = userId, ExpiresAt = DateTimeOffset.UtcNow.AddDays(7) });

        // Act
        var result = await _sut.RefreshTokenAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("rotated-jwt");
        result.RefreshToken.Should().Be("rotated-refresh");

        // Verify single-use rotation: old token is marked revoked
        existingRefreshToken.RevokedAt.Should().NotBeNull();
        _userRepoMock.Verify(r => r.UpdateRefreshTokenAsync(existingRefreshToken, It.IsAny<CancellationToken>()), Times.Once);
        _userRepoMock.Verify(r => r.AddRefreshTokenAsync(It.Is<RefreshToken>(rt => rt.Token == "rotated-refresh"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RefreshTokenAsync_WhenRevokedTokenReused_RevokesAllUserSessionsAndThrowsUnauthorizedAccessException()
    {
        // Arrange — reuse attack scenario: stolen token already used/revoked
        var stolenToken = "already-revoked-token";
        var dto = new RefreshTokenRequestDto(stolenToken);
        var userId = Guid.NewGuid();
        var revokedToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = stolenToken,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(3),
            RevokedAt = DateTimeOffset.UtcNow.AddHours(-1) // Already revoked earlier!
        };

        var user = new User
        {
            Id = userId,
            Email = "victim@test.com",
            RefreshTokens = new List<RefreshToken> { revokedToken }
        };

        _userRepoMock.Setup(r => r.GetByRefreshTokenAsync(stolenToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act & Assert
        var act = () => _sut.RefreshTokenAsync(dto);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Compromised refresh token reused*");

        // Verify that ALL sessions for this user were revoked for security
        _userRepoMock.Verify(r => r.RevokeAllUserRefreshTokensAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RefreshTokenAsync_WhenTokenExpired_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var expiredToken = "expired-token";
        var dto = new RefreshTokenRequestDto(expiredToken);
        var userId = Guid.NewGuid();
        var token = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = expiredToken,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(-1), // Expired yesterday
            RevokedAt = null
        };

        var user = new User
        {
            Id = userId,
            Email = "user@test.com",
            RefreshTokens = new List<RefreshToken> { token }
        };

        _userRepoMock.Setup(r => r.GetByRefreshTokenAsync(expiredToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act & Assert
        var act = () => _sut.RefreshTokenAsync(dto);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*expired*");
    }
}

