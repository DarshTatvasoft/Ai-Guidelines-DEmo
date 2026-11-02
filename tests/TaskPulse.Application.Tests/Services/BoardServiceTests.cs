using FluentAssertions;
using FluentValidation;
using Moq;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Exceptions;
using TaskPulse.Application.Services;
using TaskPulse.Application.Validators;
using TaskPulse.Domain.Entities;
using TaskPulse.Domain.Interfaces;
using Xunit;

namespace TaskPulse.Application.Tests.Services;

public class BoardServiceTests
{
    private readonly Mock<IBoardRepository> _boardRepoMock = new();
    private readonly IValidator<CreateBoardDto> _validator = new CreateBoardDtoValidator();
    private readonly BoardService _sut;

    public BoardServiceTests()
    {
        _sut = new BoardService(_boardRepoMock.Object, _validator);
    }

    [Fact]
    public async Task GetAllAsync_WhenBoardsExist_ReturnsMappedSummaries()
    {
        // Arrange
        var boardId = Guid.NewGuid();
        var boards = new List<Board>
        {
            new()
            {
                Id = boardId,
                Title = "Sprint 1",
                Description = "Sprint board",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                Columns = new List<Column>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        Title = "To Do",
                        TaskItems = new List<TaskItem> { new() { Id = Guid.NewGuid(), Title = "Task 1" } }
                    }
                }
            }
        };

        _boardRepoMock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(boards);

        // Act
        var result = (await _sut.GetAllAsync()).ToList();

        // Assert
        result.Should().HaveCount(1);
        result[0].Id.Should().Be(boardId);
        result[0].Title.Should().Be("Sprint 1");
        result[0].ColumnCount.Should().Be(1);
        result[0].TaskCount.Should().Be(1);
    }

    [Fact]
    public async Task GetByIdAsync_WhenBoardExists_ReturnsDetailWithOrderedColumns()
    {
        // Arrange
        var boardId = Guid.NewGuid();
        var board = new Board
        {
            Id = boardId,
            Title = "Development Board",
            Columns = new List<Column>
            {
                new() { Id = Guid.NewGuid(), Title = "In Progress", Position = 1 },
                new() { Id = Guid.NewGuid(), Title = "To Do", Position = 0 }
            }
        };

        _boardRepoMock.Setup(r => r.GetByIdWithDetailsAsync(boardId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(board);

        // Act
        var result = await _sut.GetByIdAsync(boardId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(boardId);
        result.Columns.Should().HaveCount(2);
        result.Columns[0].Title.Should().Be("To Do");
        result.Columns[1].Title.Should().Be("In Progress");
    }

    [Fact]
    public async Task GetByIdAsync_WhenBoardNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var boardId = Guid.NewGuid();
        _boardRepoMock.Setup(r => r.GetByIdWithDetailsAsync(boardId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Board?)null);

        // Act & Assert
        var act = () => _sut.GetByIdAsync(boardId);
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"*{boardId}*");
    }

    [Fact]
    public async Task CreateAsync_WithValidDto_CreatesBoardWith3DefaultKanbanColumns()
    {
        // Arrange
        var dto = new CreateBoardDto("New Project Board", "Board description");
        Board? capturedBoard = null;

        _boardRepoMock.Setup(r => r.AddAsync(It.IsAny<Board>(), It.IsAny<CancellationToken>()))
            .Callback<Board, CancellationToken>((b, _) => capturedBoard = b)
            .ReturnsAsync((Board b, CancellationToken _) => b);

        // Act
        var result = await _sut.CreateAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("New Project Board");
        result.Columns.Should().HaveCount(3);
        result.Columns.Select(c => c.Title).Should().ContainInOrder("To Do", "In Progress", "Done");

        capturedBoard.Should().NotBeNull();
        capturedBoard!.Columns.Should().HaveCount(3);
    }

    [Theory]
    [InlineData("")]
    [InlineData("AB")] // Too short (< 3)
    public async Task CreateAsync_WithInvalidTitle_ThrowsValidationException(string invalidTitle)
    {
        // Arrange
        var dto = new CreateBoardDto(invalidTitle);

        // Act & Assert
        var act = () => _sut.CreateAsync(dto);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task DeleteAsync_WhenBoardExists_CallsRepositoryDelete()
    {
        // Arrange
        var boardId = Guid.NewGuid();
        _boardRepoMock.Setup(r => r.ExistsAsync(boardId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        await _sut.DeleteAsync(boardId);

        // Assert
        _boardRepoMock.Verify(r => r.DeleteAsync(boardId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WhenBoardNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var boardId = Guid.NewGuid();
        _boardRepoMock.Setup(r => r.ExistsAsync(boardId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act & Assert
        var act = () => _sut.DeleteAsync(boardId);
        await act.Should().ThrowAsync<NotFoundException>();
    }
}

