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

public class ColumnServiceTests
{
    private readonly Mock<IColumnRepository> _columnRepoMock = new();
    private readonly Mock<IBoardRepository> _boardRepoMock = new();
    private readonly IValidator<CreateColumnDto> _validator = new CreateColumnDtoValidator();
    private readonly ColumnService _sut;

    public ColumnServiceTests()
    {
        _sut = new ColumnService(_columnRepoMock.Object, _boardRepoMock.Object, _validator);
    }

    [Fact]
    public async Task GetByBoardIdAsync_WhenBoardExists_ReturnsMappedColumns()
    {
        // Arrange
        var boardId = Guid.NewGuid();
        var columns = new List<Column>
        {
            new() { Id = Guid.NewGuid(), BoardId = boardId, Title = "To Do", Position = 0 }
        };

        _boardRepoMock.Setup(r => r.ExistsAsync(boardId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _columnRepoMock.Setup(r => r.GetByBoardIdAsync(boardId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(columns);

        // Act
        var result = (await _sut.GetByBoardIdAsync(boardId)).ToList();

        // Assert
        result.Should().HaveCount(1);
        result[0].Title.Should().Be("To Do");
    }

    [Fact]
    public async Task GetByBoardIdAsync_WhenBoardNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var boardId = Guid.NewGuid();
        _boardRepoMock.Setup(r => r.ExistsAsync(boardId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act & Assert
        var act = () => _sut.GetByBoardIdAsync(boardId);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task CreateAsync_WhenBoardExists_AppendsColumnAtNextPosition()
    {
        // Arrange
        var boardId = Guid.NewGuid();
        var dto = new CreateColumnDto("Done", "#10B981", 5);

        _boardRepoMock.Setup(r => r.ExistsAsync(boardId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _columnRepoMock.Setup(r => r.GetByBoardIdAsync(boardId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Column>
            {
                new() { Id = Guid.NewGuid(), Position = 0 },
                new() { Id = Guid.NewGuid(), Position = 1 }
            });

        Column? captured = null;
        _columnRepoMock.Setup(r => r.AddAsync(It.IsAny<Column>(), It.IsAny<CancellationToken>()))
            .Callback<Column, CancellationToken>((c, _) => captured = c)
            .ReturnsAsync((Column c, CancellationToken _) => c);

        // Act
        var result = await _sut.CreateAsync(boardId, dto);

        // Assert
        result.Should().NotBeNull();
        captured.Should().NotBeNull();
        captured!.Position.Should().Be(2);
        captured.Title.Should().Be("Done");
    }

    [Fact]
    public async Task UpdateAsync_WhenColumnExists_UpdatesFields()
    {
        // Arrange
        var columnId = Guid.NewGuid();
        var column = new Column { Id = columnId, Title = "Old Title" };
        var dto = new UpdateColumnDto("New Title", "#3B82F6", 10);

        _columnRepoMock.Setup(r => r.GetByIdAsync(columnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(column);

        // Act
        var result = await _sut.UpdateAsync(columnId, dto);

        // Assert
        result.Should().NotBeNull();
        column.Title.Should().Be("New Title");
        column.ColorHex.Should().Be("#3B82F6");
        column.WipLimit.Should().Be(10);
        _columnRepoMock.Verify(r => r.UpdateAsync(column, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WhenColumnExists_CallsRepositoryDelete()
    {
        // Arrange
        var columnId = Guid.NewGuid();
        _columnRepoMock.Setup(r => r.ExistsAsync(columnId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        await _sut.DeleteAsync(columnId);

        // Assert
        _columnRepoMock.Verify(r => r.DeleteAsync(columnId, It.IsAny<CancellationToken>()), Times.Once);
    }
}

