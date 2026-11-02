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

public class TasksControllerTests
{
    private readonly Mock<ITaskService> _taskServiceMock = new();
    private readonly TasksController _sut;

    public TasksControllerTests()
    {
        _sut = new TasksController(_taskServiceMock.Object);
    }

    [Fact]
    public async Task GetById_ReturnsOkWithApiResponse()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var taskDto = new TaskItemDto(taskId, Guid.NewGuid(), "Task 1", null, 0, TaskPriority.High, null, null, null, new(), DateTimeOffset.UtcNow);

        _taskServiceMock.Setup(s => s.GetByIdAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(taskDto);

        // Act
        var result = await _sut.GetById(taskId, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<TaskItemDto>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data!.Id.Should().Be(taskId);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtActionWithTaskDto()
    {
        // Arrange
        var columnId = Guid.NewGuid();
        var dto = new CreateTaskDto("Task 1", "Desc", TaskPriority.Medium);
        var created = new TaskItemDto(Guid.NewGuid(), columnId, "Task 1", "Desc", 0, TaskPriority.Medium, null, null, null, new(), DateTimeOffset.UtcNow);

        _taskServiceMock.Setup(s => s.CreateAsync(columnId, dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        // Act
        var result = await _sut.Create(columnId, dto, CancellationToken.None);

        // Assert
        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var apiResponse = createdResult.Value.Should().BeOfType<ApiResponse<TaskItemDto>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data!.Title.Should().Be("Task 1");
    }

    [Fact]
    public async Task Update_ReturnsOkWithApiResponse()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var dto = new UpdateTaskDto("Updated Task", "Desc", TaskPriority.Urgent, null, null, null);
        var updated = new TaskItemDto(taskId, Guid.NewGuid(), "Updated Task", "Desc", 0, TaskPriority.Urgent, null, null, null, new(), DateTimeOffset.UtcNow);

        _taskServiceMock.Setup(s => s.UpdateAsync(taskId, dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        // Act
        var result = await _sut.Update(taskId, dto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<TaskItemDto>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data!.Title.Should().Be("Updated Task");
    }

    [Fact]
    public async Task Move_ReturnsOkWithApiResponse()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var targetColumnId = Guid.NewGuid();
        var moveDto = new MoveTaskDto(targetColumnId, 2);
        var moved = new TaskItemDto(taskId, targetColumnId, "Moved Task", null, 2, TaskPriority.Low, null, null, null, new(), DateTimeOffset.UtcNow);

        _taskServiceMock.Setup(s => s.MoveAsync(taskId, moveDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(moved);

        // Act
        var result = await _sut.Move(taskId, moveDto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<TaskItemDto>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data!.ColumnId.Should().Be(targetColumnId);
        apiResponse.Data!.Position.Should().Be(2);
    }

    [Fact]
    public async Task Delete_ReturnsOkWithApiResponse()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        _taskServiceMock.Setup(s => s.DeleteAsync(taskId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.Delete(taskId, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<object>>().Subject;
        apiResponse.Success.Should().BeTrue();
    }
}

