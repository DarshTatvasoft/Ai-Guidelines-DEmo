using FluentAssertions;
using Moq;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Exceptions;
using TaskPulse.Application.Services;
using TaskPulse.Domain.Entities;
using TaskPulse.Domain.Enums;
using TaskPulse.Domain.Interfaces;
using Xunit;

namespace TaskPulse.Application.Tests.Services;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<ITaskRepository> _taskRepositoryMock;
    private readonly UserService _sut;

    public UserServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _taskRepositoryMock = new Mock<ITaskRepository>();
        _sut = new UserService(_userRepositoryMock.Object, _taskRepositoryMock.Object);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsMappedUsers()
    {
        // Arrange
        var users = new List<User>
        {
            new() { Id = Guid.NewGuid(), FullName = "Alice Doe", Email = "alice@example.com", AvatarUrl = "https://example.com/avatar1.png" },
            new() { Id = Guid.NewGuid(), FullName = "Bob Smith", Email = "bob@example.com", AvatarUrl = null }
        };

        _userRepositoryMock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        // Act
        var result = (await _sut.GetAllAsync()).ToList();

        // Assert
        result.Should().HaveCount(2);
        result[0].FullName.Should().Be("Alice Doe");
        result[0].Email.Should().Be("alice@example.com");
        result[1].FullName.Should().Be("Bob Smith");
        result[1].AvatarUrl.Should().BeNull();
    }

    [Fact]
    public async Task AssignTaskUserAsync_WhenValidUser_AssignsUserAndReturnsDto()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Charlie Brown", Email = "charlie@example.com" };
        var task = new TaskItem
        {
            Id = taskId,
            ColumnId = Guid.NewGuid(),
            Title = "Implement Feature",
            Position = 1,
            Priority = TaskPriority.Medium,
            TaskLabels = new List<TaskLabel>()
        };

        _taskRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var dto = new AssignUserDto(userId);

        // Act
        var result = await _sut.AssignTaskUserAsync(taskId, dto);

        // Assert
        result.Should().NotBeNull();
        result.AssigneeId.Should().Be(userId);
        result.AssigneeName.Should().Be("Charlie Brown");
        _taskRepositoryMock.Verify(r => r.UpdateAsync(It.Is<TaskItem>(t => t.AssigneeId == userId), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AssignTaskUserAsync_WhenUserIdNull_UnassignsUser()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var existingUser = new User { Id = Guid.NewGuid(), FullName = "Previous Assignee", Email = "prev@example.com" };
        var task = new TaskItem
        {
            Id = taskId,
            ColumnId = Guid.NewGuid(),
            Title = "Implement Feature",
            Position = 1,
            Priority = TaskPriority.High,
            AssigneeId = existingUser.Id,
            Assignee = existingUser,
            TaskLabels = new List<TaskLabel>()
        };

        _taskRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        var dto = new AssignUserDto(null);

        // Act
        var result = await _sut.AssignTaskUserAsync(taskId, dto);

        // Assert
        result.Should().NotBeNull();
        result.AssigneeId.Should().BeNull();
        result.AssigneeName.Should().BeNull();
        _taskRepositoryMock.Verify(r => r.UpdateAsync(It.Is<TaskItem>(t => t.AssigneeId == null && t.Assignee == null), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AssignTaskUserAsync_WhenTaskNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        _taskRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskItem?)null);

        var dto = new AssignUserDto(Guid.NewGuid());

        // Act
        var act = async () => await _sut.AssignTaskUserAsync(taskId, dto);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task AssignTaskUserAsync_WhenUserNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var task = new TaskItem
        {
            Id = taskId,
            ColumnId = Guid.NewGuid(),
            Title = "Task",
            Position = 1,
            Priority = TaskPriority.Low,
            TaskLabels = new List<TaskLabel>()
        };

        _taskRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var dto = new AssignUserDto(userId);

        // Act
        var act = async () => await _sut.AssignTaskUserAsync(taskId, dto);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }
}

