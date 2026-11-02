using FluentAssertions;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Validators;
using TaskPulse.Domain.Enums;
using Xunit;

namespace TaskPulse.Application.Tests.Validators;

public class ValidatorTests
{
    private readonly CreateBoardDtoValidator _boardValidator = new();
    private readonly CreateColumnDtoValidator _columnValidator = new();
    private readonly CreateTaskDtoValidator _taskValidator = new();
    private readonly MoveTaskDtoValidator _moveValidator = new();

    [Theory]
    [InlineData("Valid Title", true)]
    [InlineData("A", false)]                      // Under 3 chars
    [InlineData("", false)]                       // Empty
    [InlineData(null, false)]                     // Null
    public void CreateBoardDtoValidator_ValidatesTitleLength(string? title, bool expectedValid)
    {
        var dto = new CreateBoardDto(title!);
        var result = _boardValidator.Validate(dto);
        result.IsValid.Should().Be(expectedValid);
    }

    [Theory]
    [InlineData("#3B82F6", true)]
    [InlineData("#FFF", true)]
    [InlineData("invalid-hex", false)]
    public void CreateColumnDtoValidator_ValidatesColorHex(string color, bool expectedValid)
    {
        var dto = new CreateColumnDto("Sprint Column", color);
        var result = _columnValidator.Validate(dto);
        result.IsValid.Should().Be(expectedValid);
    }

    [Fact]
    public void CreateTaskDtoValidator_WhenTitleEmpty_FailsValidation()
    {
        var dto = new CreateTaskDto("", "Description", TaskPriority.Medium);
        var result = _taskValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateTaskDto.Title));
    }

    [Fact]
    public void MoveTaskDtoValidator_WhenPositionNegative_FailsValidation()
    {
        var dto = new MoveTaskDto(Guid.NewGuid(), -1);
        var result = _moveValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(MoveTaskDto.NewPosition));
    }
}

