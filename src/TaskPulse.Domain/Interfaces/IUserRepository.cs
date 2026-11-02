using TaskPulse.Domain.Entities;

namespace TaskPulse.Domain.Interfaces;

public interface IUserRepository
{
    Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<User?> GetByRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);

    Task<User> AddAsync(User user, CancellationToken cancellationToken = default);

    Task UpdateAsync(User user, CancellationToken cancellationToken = default);

    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task AddRefreshTokenAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default);

    Task UpdateRefreshTokenAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default);

    Task RevokeAllUserRefreshTokensAsync(Guid userId, CancellationToken cancellationToken = default);
}

