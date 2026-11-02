using System.Text.Json;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using TaskPulse.API.Common;
using TaskPulse.API.Middleware;
using TaskPulse.Application.Exceptions;
using Xunit;

namespace TaskPulse.API.Tests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    private readonly NullLogger<ExceptionHandlingMiddleware> _logger = NullLogger<ExceptionHandlingMiddleware>.Instance;

    [Fact]
    public async Task InvokeAsync_WhenNoException_CallsNext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new ExceptionHandlingMiddleware(next, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task InvokeAsync_WhenValidationException_Returns400WithErrors()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var failures = new List<ValidationFailure>
        {
            new("Title", "Title is required.")
        };

        RequestDelegate next = _ => throw new ValidationException(failures);
        var middleware = new ExceptionHandlingMiddleware(next, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(400);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var response = await JsonSerializer.DeserializeAsync<ApiResponse<object>>(
            context.Response.Body,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        response.Should().NotBeNull();
        response!.Success.Should().BeFalse();
        response.Errors.Should().Contain("Title is required.");
    }

    [Fact]
    public async Task InvokeAsync_WhenUnauthorizedAccessException_Returns401WithMessage()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        RequestDelegate next = _ => throw new UnauthorizedAccessException("Invalid credentials provided.");
        var middleware = new ExceptionHandlingMiddleware(next, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(401);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var response = await JsonSerializer.DeserializeAsync<ApiResponse<object>>(
            context.Response.Body,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        response.Should().NotBeNull();
        response!.Success.Should().BeFalse();
        response.Message.Should().Be("Invalid credentials provided.");
    }

    [Fact]
    public async Task InvokeAsync_WhenNotFoundException_Returns404WithMessage()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        RequestDelegate next = _ => throw new NotFoundException("Board", Guid.NewGuid());
        var middleware = new ExceptionHandlingMiddleware(next, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(404);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var response = await JsonSerializer.DeserializeAsync<ApiResponse<object>>(
            context.Response.Body,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        response.Should().NotBeNull();
        response!.Success.Should().BeFalse();
        response.Message.Should().Contain("was not found");
    }

    [Fact]
    public async Task InvokeAsync_WhenWipLimitExceededException_Returns400WithMessage()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        RequestDelegate next = _ => throw new WipLimitExceededException(Guid.NewGuid(), 3);
        var middleware = new ExceptionHandlingMiddleware(next, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(400);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var response = await JsonSerializer.DeserializeAsync<ApiResponse<object>>(
            context.Response.Body,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        response.Should().NotBeNull();
        response!.Success.Should().BeFalse();
        response.Message.Should().Contain("WIP limit of 3");
    }

    [Fact]
    public async Task InvokeAsync_WhenUnhandledException_Returns500WithGenericMessage()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        RequestDelegate next = _ => throw new InvalidOperationException("Fatal database crash");
        var middleware = new ExceptionHandlingMiddleware(next, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(500);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var response = await JsonSerializer.DeserializeAsync<ApiResponse<object>>(
            context.Response.Body,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        response.Should().NotBeNull();
        response!.Success.Should().BeFalse();
        response.Message.Should().Be("An unexpected error occurred. Please try again later.");
    }
}

