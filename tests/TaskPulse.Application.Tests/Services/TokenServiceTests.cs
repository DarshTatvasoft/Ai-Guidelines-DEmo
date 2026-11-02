using System.IdentityModel.Tokens.Jwt;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using TaskPulse.Application.Services;
using TaskPulse.Domain.Entities;
using Xunit;

namespace TaskPulse.Application.Tests.Services;

public class TokenServiceTests
{
    private readonly TokenService _sut;

    public TokenServiceTests()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Jwt:SecretKey"]).Returns("SuperSecretKeyForUnitTestingPurposesOnly2026!MustBe256Bits");
        configMock.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
        configMock.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");
        configMock.Setup(c => c["Jwt:AccessTokenExpirationMinutes"]).Returns("15");
        configMock.Setup(c => c["Jwt:RefreshTokenExpirationDays"]).Returns("7");

        _sut = new TokenService(configMock.Object);
    }

    [Fact]
    public void GenerateAccessToken_ReturnsValidJwtWith15MinExpiry()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@test.com",
            FullName = "Test User"
        };

        // Act
        var (token, expiresAt) = _sut.GenerateAccessToken(user);

        // Assert
        token.Should().NotBeNullOrWhiteSpace();
        expiresAt.Should().BeCloseTo(DateTimeOffset.UtcNow.AddMinutes(15), TimeSpan.FromSeconds(5));

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        jwt.Issuer.Should().Be("TestIssuer");
        jwt.Audiences.Should().Contain("TestAudience");
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsRandomCryptoTokenWith7DayExpiry()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var refreshToken = _sut.GenerateRefreshToken(userId);

        // Assert
        refreshToken.Should().NotBeNull();
        refreshToken.UserId.Should().Be(userId);
        refreshToken.Token.Should().NotBeNullOrWhiteSpace();
        refreshToken.ExpiresAt.Should().BeCloseTo(DateTimeOffset.UtcNow.AddDays(7), TimeSpan.FromSeconds(5));
        refreshToken.IsExpired.Should().BeFalse();
        refreshToken.IsActive.Should().BeTrue();
    }
}
