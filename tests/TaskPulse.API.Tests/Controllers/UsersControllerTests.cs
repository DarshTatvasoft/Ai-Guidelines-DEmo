using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TaskPulse.API.Common;
using TaskPulse.API.Controllers;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Interfaces;
using TaskPulse.Domain.Enums;
using Xunit;

namespace TaskPulse.API.Tests.Controllers;

public class UsersControllerTests
{
    private readonly Mock<IUserService> _userServiceMock = new();
    private readonly UsersController _sut;

    public UsersControllerTests()
    {
        _sut = new UsersController(_userServiceMock.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithUsers()
    {
        // Arrange
        var users = new List<UserDto>
        {
            new(Guid.NewGuid(), "Jane Doe", "jane@example.com", null),
            new(Guid.NewGuid(), "John Doe", "john@example.com", null)
        };

        _userServiceMock.Setup(s => s.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        // Act
        var result = await _sut.GetAll(CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<UserDto>>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task AssignUser_WhenUserIdProvided_ReturnsOkWithUpdatedTask()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var dto = new AssignUserDto(userId);
        var taskDto = new TaskItemDto(
            taskId,
            Guid.NewGuid(),
            "Task 1",
            null,
            0,
            TaskPriority.Medium,
            null,
            userId,
            "Jane Doe",
            new(),
            DateTimeOffset.UtcNow);

        _userServiceMock.Setup(s => s.AssignTaskUserAsync(taskId, dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(taskDto);

        // Act
        var result = await _sut.AssignUser(taskId, dto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<TaskItemDto>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data!.AssigneeId.Should().Be(userId);
        apiResponse.Message.Should().Be("User assigned to task successfully.");
    }

    [Fact]
    public async Task AssignUser_WhenUserIdNull_ReturnsOkWithUnassignedMessage()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var dto = new AssignUserDto(null);
        var taskDto = new TaskItemDto(
            taskId,
            Guid.NewGuid(),
            "Task 1",
            null,
            0,
            TaskPriority.Medium,
            null,
            null,
            null,
            new(),
            DateTimeOffset.UtcNow);

        _userServiceMock.Setup(s => s.AssignTaskUserAsync(taskId, dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(taskDto);

        // Act
        var result = await _sut.AssignUser(taskId, dto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<TaskItemDto>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data!.AssigneeId.Should().BeNull();
        apiResponse.Message.Should().Be("User unassigned from task successfully.");
    }
}

