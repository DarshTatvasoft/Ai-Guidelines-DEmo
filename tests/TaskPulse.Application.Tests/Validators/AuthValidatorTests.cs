using FluentAssertions;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Validators;
using Xunit;

namespace TaskPulse.Application.Tests.Validators;

public class AuthValidatorTests
{
    private readonly RegisterDtoValidator _registerValidator = new();
    private readonly LoginDtoValidator _loginValidator = new();

    [Theory]
    [InlineData("Valid User", "valid@test.com", "Password123!", true)]
    [InlineData("", "valid@test.com", "Password123!", false)]                // Missing name
    [InlineData("Valid User", "invalid-email", "Password123!", false)]        // Invalid email
    [InlineData("Valid User", "valid@test.com", "short1", false)]             // Too short (< 8)
    [InlineData("Valid User", "valid@test.com", "nouppercase123", false)]      // Missing uppercase
    [InlineData("Valid User", "valid@test.com", "NOLOWERCASE123", false)]      // Missing lowercase
    [InlineData("Valid User", "valid@test.com", "NoDigitsInPassword", false)]  // Missing digit
    public void RegisterDtoValidator_ValidatesRules(string name, string email, string password, bool expectedValid)
    {
        var dto = new RegisterDto(name, email, password);
        var result = _registerValidator.Validate(dto);
        result.IsValid.Should().Be(expectedValid);
    }

    [Theory]
    [InlineData("valid@test.com", "Password123", true)]
    [InlineData("", "Password123", false)]
    [InlineData("invalid-email", "Password123", false)]
    [InlineData("valid@test.com", "", false)]
    public void LoginDtoValidator_ValidatesRules(string email, string password, bool expectedValid)
    {
        var dto = new LoginDto(email, password);
        var result = _loginValidator.Validate(dto);
        result.IsValid.Should().Be(expectedValid);
    }
}

