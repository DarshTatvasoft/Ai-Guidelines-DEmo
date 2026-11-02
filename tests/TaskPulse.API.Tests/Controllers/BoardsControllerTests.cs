using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TaskPulse.API.Common;
using TaskPulse.API.Controllers;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Interfaces;
using Xunit;

namespace TaskPulse.API.Tests.Controllers;

public class BoardsControllerTests
{
    private readonly Mock<IBoardService> _boardServiceMock = new();
    private readonly BoardsController _sut;

    public BoardsControllerTests()
    {
        _sut = new BoardsController(_boardServiceMock.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithApiResponse()
    {
        // Arrange
        var summaries = new List<BoardSummaryDto>
        {
            new(Guid.NewGuid(), "Board 1", "Desc", true, 3, 5, DateTimeOffset.UtcNow)
        };

        _boardServiceMock.Setup(s => s.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(summaries);

        // Act
        var result = await _sut.GetAll(CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<BoardSummaryDto>>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetById_ReturnsOkWithApiResponse()
    {
        // Arrange
        var boardId = Guid.NewGuid();
        var detail = new BoardDetailDto(boardId, "Board 1", "Desc", true, DateTimeOffset.UtcNow, new List<ColumnDto>());

        _boardServiceMock.Setup(s => s.GetByIdAsync(boardId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        // Act
        var result = await _sut.GetById(boardId, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<BoardDetailDto>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data!.Id.Should().Be(boardId);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtActionWithBoardDetail()
    {
        // Arrange
        var dto = new CreateBoardDto("New Board", "Desc");
        var created = new BoardDetailDto(Guid.NewGuid(), "New Board", "Desc", true, DateTimeOffset.UtcNow, new List<ColumnDto>());

        _boardServiceMock.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        // Act
        var result = await _sut.Create(dto, CancellationToken.None);

        // Assert
        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var apiResponse = createdResult.Value.Should().BeOfType<ApiResponse<BoardDetailDto>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Data!.Title.Should().Be("New Board");
    }

    [Fact]
    public async Task Delete_ReturnsOkWithApiResponse()
    {
        // Arrange
        var boardId = Guid.NewGuid();
        _boardServiceMock.Setup(s => s.DeleteAsync(boardId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.Delete(boardId, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeOfType<ApiResponse<object>>().Subject;
        apiResponse.Success.Should().BeTrue();
        _boardServiceMock.Verify(s => s.DeleteAsync(boardId, It.IsAny<CancellationToken>()), Times.Once);
    }
}

