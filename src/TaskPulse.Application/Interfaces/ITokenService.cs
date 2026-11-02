using TaskPulse.Domain.Entities;

namespace TaskPulse.Application.Interfaces;

public interface ITokenService
{
    (string Token, DateTimeOffset ExpiresAt) GenerateAccessToken(User user);

    RefreshToken GenerateRefreshToken(Guid userId);
}

