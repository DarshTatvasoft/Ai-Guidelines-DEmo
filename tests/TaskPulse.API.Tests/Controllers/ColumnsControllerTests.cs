using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TaskPulse.API.Common;
using TaskPulse.API.Controllers;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Interfaces;
using Xunit;

namespace TaskPulse.API.Tests.Controllers;

public class ColumnsControllerTests
{
    private readonly Mock<IColumnService> _columnServiceMock = new();
    private readonly ColumnsController _sut;

    public ColumnsControllerTests()
    {
        _sut = new ColumnsController(_columnServiceMock.Object);
    }

    [Fact]
    public async Task GetByBoardId_WhenBoardExists_ReturnsOkWithColumns()
    {
        // Arrange
        var boardId = Guid.NewGuid();
        var columns = new List<ColumnDto>
        {
            new(Guid.NewGuid(), boardId, "To Do", 0, "#64748B", null, new List<TaskItemDto>())
        };

        _columnServiceMock.Setup(s => s.GetByBoardIdAsync(boardId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(columns);

        // Act
        var result = await _sut.GetByBoardId(boardId, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<ColumnDto>>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data.Should().HaveCount(1);
    }

    [Fact]
    public async Task Create_WhenBoardExists_AddsColumnAndReturnsCreated()
    {
        // Arrange
        var boardId = Guid.NewGuid();
        var dto = new CreateColumnDto("Review", "#A855F7", 3);
        var createdColumn = new ColumnDto(Guid.NewGuid(), boardId, "Review", 1, "#A855F7", 3, new List<TaskItemDto>());

        _columnServiceMock.Setup(s => s.CreateAsync(boardId, dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdColumn);

        // Act
        var result = await _sut.Create(boardId, dto, CancellationToken.None);

        // Assert
        var createdResult = result.Should().BeOfType<CreatedResult>().Subject;
        var apiResponse = createdResult.Value.Should().BeOfType<ApiResponse<ColumnDto>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data!.Title.Should().Be("Review");
    }

    [Fact]
    public async Task Update_WhenColumnExists_UpdatesAndReturnsOk()
    {
        // Arrange
        var columnId = Guid.NewGuid();
        var dto = new UpdateColumnDto("New Title", "#3B82F6", 5);
        var updated = new ColumnDto(columnId, Guid.NewGuid(), "New Title", 0, "#3B82F6", 5, new List<TaskItemDto>());

        _columnServiceMock.Setup(s => s.UpdateAsync(columnId, dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        // Act
        var result = await _sut.Update(columnId, dto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<ColumnDto>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data!.Title.Should().Be("New Title");
    }

    [Fact]
    public async Task Delete_WhenColumnExists_DeletesAndReturnsOk()
    {
        // Arrange
        var columnId = Guid.NewGuid();
        _columnServiceMock.Setup(s => s.DeleteAsync(columnId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.Delete(columnId, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<object>>().Subject;
        apiResponse.Success.Should().BeTrue();
        _columnServiceMock.Verify(s => s.DeleteAsync(columnId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
