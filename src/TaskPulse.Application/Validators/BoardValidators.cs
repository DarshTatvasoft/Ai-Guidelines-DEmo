using FluentValidation;
using TaskPulse.Application.DTOs;

namespace TaskPulse.Application.Validators;

public class CreateBoardDtoValidator : AbstractValidator<CreateBoardDto>
{
    public CreateBoardDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Board title is required.")
            .MinimumLength(3).WithMessage("Board title must be at least 3 characters.")
            .MaximumLength(100).WithMessage("Board title cannot exceed 100 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.");
    }
}

public class CreateColumnDtoValidator : AbstractValidator<CreateColumnDto>
{
    public CreateColumnDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Column title is required.")
            .MaximumLength(50).WithMessage("Column title cannot exceed 50 characters.");

        RuleFor(x => x.ColorHex)
            .Matches("^#(?:[0-9a-fA-F]{3}){1,2}$").When(x => !string.IsNullOrEmpty(x.ColorHex))
            .WithMessage("Color must be a valid hex code (e.g., #3B82F6).");

        RuleFor(x => x.WipLimit)
            .GreaterThan(0).When(x => x.WipLimit.HasValue)
            .WithMessage("WIP limit must be greater than 0 if set.");
    }
}

public class CreateTaskDtoValidator : AbstractValidator<CreateTaskDto>
{
    public CreateTaskDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Task title is required.")
            .MaximumLength(200).WithMessage("Task title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Task description cannot exceed 2000 characters.");

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Priority must be a valid TaskPriority value (Low, Medium, High, Urgent).");
    }
}

public class UpdateTaskDtoValidator : AbstractValidator<UpdateTaskDto>
{
    public UpdateTaskDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Task title is required.")
            .MaximumLength(200).WithMessage("Task title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Task description cannot exceed 2000 characters.");

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Priority must be a valid TaskPriority value.");
    }
}

public class MoveTaskDtoValidator : AbstractValidator<MoveTaskDto>
{
    public MoveTaskDtoValidator()
    {
        RuleFor(x => x.TargetColumnId)
            .NotEmpty().WithMessage("Target column ID is required.");

        RuleFor(x => x.NewPosition)
            .GreaterThanOrEqualTo(0).WithMessage("New position must be greater than or equal to 0.");
    }
}

