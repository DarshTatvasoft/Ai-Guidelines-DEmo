using FluentValidation;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Exceptions;
using TaskPulse.Application.Interfaces;
using TaskPulse.Domain.Entities;
using TaskPulse.Domain.Interfaces;

namespace TaskPulse.Application.Services;

public class BoardService : IBoardService
{
    private readonly IBoardRepository _boardRepository;
    private readonly IValidator<CreateBoardDto> _createBoardValidator;

    public BoardService(
        IBoardRepository boardRepository,
        IValidator<CreateBoardDto> createBoardValidator)
    {
        _boardRepository = boardRepository;
        _createBoardValidator = createBoardValidator;
    }

    public async Task<IEnumerable<BoardSummaryDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var boards = await _boardRepository.GetAllAsync(cancellationToken);

        return boards.Select(b => new BoardSummaryDto(
            b.Id,
            b.Title,
            b.Description,
            b.IsActive,
            b.Columns.Count,
            b.Columns.SelectMany(c => c.TaskItems).Count(),
            b.CreatedAt));
    }

    public async Task<BoardDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var board = await _boardRepository.GetByIdWithDetailsAsync(id, cancellationToken);
        if (board is null)
        {
            throw new NotFoundException(nameof(Board), id);
        }

        return MapToDetailDto(board);
    }

    public async Task<BoardDetailDto> CreateAsync(CreateBoardDto dto, CancellationToken cancellationToken = default)
    {
        await _createBoardValidator.ValidateAndThrowAsync(dto, cancellationToken);

        var board = new Board
        {
            Id = Guid.NewGuid(),
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            IsActive = true,
            Columns = new List<Column>
            {
                new() { Id = Guid.NewGuid(), Title = "To Do", Position = 0, ColorHex = "#64748B" },
                new() { Id = Guid.NewGuid(), Title = "In Progress", Position = 1, ColorHex = "#3B82F6" },
                new() { Id = Guid.NewGuid(), Title = "Done", Position = 2, ColorHex = "#10B981" }
            }
        };

        var created = await _boardRepository.AddAsync(board, cancellationToken);
        return MapToDetailDto(created);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exists = await _boardRepository.ExistsAsync(id, cancellationToken);
        if (!exists)
        {
            throw new NotFoundException(nameof(Board), id);
        }

        await _boardRepository.DeleteAsync(id, cancellationToken);
    }

    private static BoardDetailDto MapToDetailDto(Board board)
    {
        var columnDtos = board.Columns
            .OrderBy(c => c.Position)
            .Select(c => new ColumnDto(
                c.Id,
                c.BoardId,
                c.Title,
                c.Position,
                c.ColorHex,
                c.WipLimit,
                c.TaskItems
                    .OrderBy(t => t.Position)
                    .Select(t => new TaskItemDto(
                        t.Id,
                        t.ColumnId,
                        t.Title,
                        t.Description,
                        t.Position,
                        t.Priority,
                        t.DueDate,
                        t.AssigneeId,
                        t.Assignee?.FullName,
                        t.TaskLabels.Select(tl => new LabelDto(tl.Label.Id, tl.Label.Name, tl.Label.ColorHex)).ToList(),
                        t.CreatedAt))
                    .ToList()))
            .ToList();

        return new BoardDetailDto(
            board.Id,
            board.Title,
            board.Description,
            board.IsActive,
            board.CreatedAt,
            columnDtos);
    }
}

