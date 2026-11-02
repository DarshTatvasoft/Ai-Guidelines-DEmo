using System.Security.Cryptography;
using System.Text;
using TaskPulse.Application.Interfaces;

namespace TaskPulse.Application.Services;

public class PasswordHasher : IPasswordHasher
{
    public void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);

        using var hmac = new HMACSHA512();
        passwordSalt = hmac.Key;
        passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
    }

    public bool VerifyPasswordHash(string password, byte[] storedHash, byte[] storedSalt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        ArgumentNullException.ThrowIfNull(storedHash);
        ArgumentNullException.ThrowIfNull(storedSalt);

        if (storedHash.Length == 0 || storedSalt.Length == 0)
        {
            return false;
        }

        using var hmac = new HMACSHA512(storedSalt);
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));

        return CryptographicOperations.FixedTimeEquals(computedHash, storedHash);
    }
}

