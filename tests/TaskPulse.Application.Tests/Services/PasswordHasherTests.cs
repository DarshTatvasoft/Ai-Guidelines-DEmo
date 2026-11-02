using FluentAssertions;
using TaskPulse.Application.Services;
using Xunit;

namespace TaskPulse.Application.Tests.Services;

public class PasswordHasherTests
{
    private readonly PasswordHasher _sut = new();

    [Fact]
    public void CreatePasswordHash_GeneratesNonEmptyHashAndSalt()
    {
        // Act
        _sut.CreatePasswordHash("SecureP@ssw0rd!", out var hash, out var salt);

        // Assert
        hash.Should().NotBeNullOrEmpty();
        salt.Should().NotBeNullOrEmpty();
        hash.Length.Should().Be(64); // HMACSHA512 produces 512 bits = 64 bytes
        salt.Length.Should().Be(128); // HMACSHA512 key is 128 bytes
    }

    [Fact]
    public void VerifyPasswordHash_WithCorrectPassword_ReturnsTrue()
    {
        // Arrange
        _sut.CreatePasswordHash("CorrectPassword123!", out var hash, out var salt);

        // Act
        var isValid = _sut.VerifyPasswordHash("CorrectPassword123!", hash, salt);

        // Assert
        isValid.Should().BeTrue();
    }

    [Fact]
    public void VerifyPasswordHash_WithIncorrectPassword_ReturnsFalse()
    {
        // Arrange
        _sut.CreatePasswordHash("CorrectPassword123!", out var hash, out var salt);

        // Act
        var isValid = _sut.VerifyPasswordHash("WrongPassword999!", hash, salt);

        // Assert
        isValid.Should().BeFalse();
    }

    [Fact]
    public void VerifyPasswordHash_WithTamperedSalt_ReturnsFalse()
    {
        // Arrange
        _sut.CreatePasswordHash("TestPassword!", out var hash, out var salt);
        var tamperedSalt = (byte[])salt.Clone();
        tamperedSalt[0] = (byte)(tamperedSalt[0] ^ 0xFF);

        // Act
        var isValid = _sut.VerifyPasswordHash("TestPassword!", hash, tamperedSalt);

        // Assert
        isValid.Should().BeFalse();
    }
}

