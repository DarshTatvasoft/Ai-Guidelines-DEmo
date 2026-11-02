using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TaskPulse.API.Common;
using TaskPulse.API.Controllers;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Interfaces;
using Xunit;

namespace TaskPulse.API.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _authServiceMock = new();
    private readonly AuthController _sut;

    public AuthControllerTests()
    {
        _sut = new AuthController(_authServiceMock.Object);
    }

    [Fact]
    public async Task Register_WithValidDto_Returns201CreatedWithTokens()
    {
        // Arrange
        var dto = new RegisterDto("Test User", "test@example.com", "Password123!");
        var tokenResponse = new TokenResponseDto("jwt-token", "refresh-token", DateTimeOffset.UtcNow.AddMinutes(15));

        _authServiceMock.Setup(s => s.RegisterAsync(dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tokenResponse);

        // Act
        var result = await _sut.Register(dto, CancellationToken.None);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(201);
        var apiResponse = objectResult.Value.Should().BeOfType<ApiResponse<TokenResponseDto>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data!.AccessToken.Should().Be("jwt-token");
    }

    [Fact]
    public async Task Login_WithValidDto_Returns200OkWithTokens()
    {
        // Arrange
        var dto = new LoginDto("test@example.com", "Password123!");
        var tokenResponse = new TokenResponseDto("jwt-token", "refresh-token", DateTimeOffset.UtcNow.AddMinutes(15));

        _authServiceMock.Setup(s => s.LoginAsync(dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tokenResponse);

        // Act
        var result = await _sut.Login(dto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<TokenResponseDto>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data!.RefreshToken.Should().Be("refresh-token");
    }

    [Fact]
    public async Task Refresh_WithValidDto_Returns200OkWithTokens()
    {
        // Arrange
        var dto = new RefreshTokenRequestDto("refresh-token-123");
        var tokenResponse = new TokenResponseDto("new-jwt", "new-refresh", DateTimeOffset.UtcNow.AddMinutes(15));

        _authServiceMock.Setup(s => s.RefreshTokenAsync(dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tokenResponse);

        // Act
        var result = await _sut.Refresh(dto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<TokenResponseDto>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data!.AccessToken.Should().Be("new-jwt");
    }
}

