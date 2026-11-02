using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TaskPulse.Application.Interfaces;
using TaskPulse.Domain.Entities;

namespace TaskPulse.Application.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private const string DefaultSecret = "TaskPulseSuperSecretSigningKey2026!MustBeAtLeast256BitsLongForHmacSha256Security";

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string Token, DateTimeOffset ExpiresAt) GenerateAccessToken(User user)
    {
        var secretKey = _configuration["Jwt:SecretKey"] ?? DefaultSecret;
        var issuer = _configuration["Jwt:Issuer"] ?? "TaskPulse";
        var audience = _configuration["Jwt:Audience"] ?? "TaskPulseClient";
        var expirationMinutes = int.TryParse(_configuration["Jwt:AccessTokenExpirationMinutes"], out var exp) ? exp : 15;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(expirationMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Name, user.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAt.UtcDateTime,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return (tokenHandler.WriteToken(token), expiresAt);
    }

    public RefreshToken GenerateRefreshToken(Guid userId)
    {
        var expirationDays = int.TryParse(_configuration["Jwt:RefreshTokenExpirationDays"], out var exp) ? exp : 7;

        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);

        var tokenString = Convert.ToBase64String(randomBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");

        return new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = tokenString,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(expirationDays),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}

