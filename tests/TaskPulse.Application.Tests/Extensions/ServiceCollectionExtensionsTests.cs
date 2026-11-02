using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Exceptions;
using TaskPulse.Application.Extensions;
using TaskPulse.Application.Interfaces;
using Xunit;

namespace TaskPulse.Application.Tests.Extensions;

public class ServiceCollectionExtensionsTests
{
    [Fact]
    public void AddApplicationServices_RegistersServicesAndValidators()
    {
        // Arrange
        var services = new ServiceCollection();

        // Act
        services.AddApplicationServices();

        // Assert
        services.Should().Contain(s => s.ServiceType == typeof(IBoardService));
        services.Should().Contain(s => s.ServiceType == typeof(ITaskService));
        services.Should().Contain(s => s.ServiceType == typeof(IValidator<CreateBoardDto>));
        services.Should().Contain(s => s.ServiceType == typeof(IValidator<CreateTaskDto>));
    }

    [Fact]
    public void NotFoundException_InitializesWithMessage()
    {
        var ex = new NotFoundException("Custom error message");
        ex.Message.Should().Be("Custom error message");
    }
}
