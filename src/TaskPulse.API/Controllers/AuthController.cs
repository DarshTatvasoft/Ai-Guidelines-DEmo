using Microsoft.AspNetCore.Mvc;
using TaskPulse.API.Common;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Interfaces;

namespace TaskPulse.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Registers a new user account and returns an access and refresh token pair.
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<TokenResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto, CancellationToken cancellationToken)
    {
        var response = await _authService.RegisterAsync(dto, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<TokenResponseDto>.Ok(response, "User registered successfully."));
    }

    /// <summary>
    /// Authenticates a user with email and password, returning an access and refresh token pair.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<TokenResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginDto dto, CancellationToken cancellationToken)
    {
        var response = await _authService.LoginAsync(dto, cancellationToken);
        return Ok(ApiResponse<TokenResponseDto>.Ok(response, "Authentication successful."));
    }

    /// <summary>
    /// Rotates a single-use refresh token to issue a fresh JWT access token and new refresh token.
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<TokenResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto dto, CancellationToken cancellationToken)
    {
        var response = await _authService.RefreshTokenAsync(dto, cancellationToken);
        return Ok(ApiResponse<TokenResponseDto>.Ok(response, "Token refreshed successfully."));
    }
}

