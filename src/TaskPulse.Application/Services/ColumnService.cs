using FluentValidation;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Exceptions;
using TaskPulse.Application.Interfaces;
using TaskPulse.Domain.Entities;
using TaskPulse.Domain.Interfaces;

namespace TaskPulse.Application.Services;

public class ColumnService : IColumnService
{
    private readonly IColumnRepository _columnRepository;
    private readonly IBoardRepository _boardRepository;
    private readonly IValidator<CreateColumnDto> _createColumnValidator;

    public ColumnService(
        IColumnRepository columnRepository,
        IBoardRepository boardRepository,
        IValidator<CreateColumnDto> createColumnValidator)
    {
        _columnRepository = columnRepository;
        _boardRepository = boardRepository;
        _createColumnValidator = createColumnValidator;
    }

    public async Task<IEnumerable<ColumnDto>> GetByBoardIdAsync(Guid boardId, CancellationToken cancellationToken = default)
    {
        var boardExists = await _boardRepository.ExistsAsync(boardId, cancellationToken);
        if (!boardExists)
        {
            throw new NotFoundException(nameof(Board), boardId);
        }

        var columns = await _columnRepository.GetByBoardIdAsync(boardId, cancellationToken);
        return columns.Select(MapToDto);
    }

    public async Task<ColumnDto> CreateAsync(Guid boardId, CreateColumnDto dto, CancellationToken cancellationToken = default)
    {
        await _createColumnValidator.ValidateAndThrowAsync(dto, cancellationToken);

        var boardExists = await _boardRepository.ExistsAsync(boardId, cancellationToken);
        if (!boardExists)
        {
            throw new NotFoundException(nameof(Board), boardId);
        }

        var existingColumns = await _columnRepository.GetByBoardIdAsync(boardId, cancellationToken);
        var position = existingColumns.Count();

        var column = new Column
        {
            Id = Guid.NewGuid(),
            BoardId = boardId,
            Title = dto.Title.Trim(),
            Position = position,
            ColorHex = string.IsNullOrWhiteSpace(dto.ColorHex) ? "#64748B" : dto.ColorHex,
            WipLimit = dto.WipLimit
        };

        var created = await _columnRepository.AddAsync(column, cancellationToken);
        return MapToDto(created);
    }

    public async Task<ColumnDto> UpdateAsync(Guid id, UpdateColumnDto dto, CancellationToken cancellationToken = default)
    {
        var column = await _columnRepository.GetByIdAsync(id, cancellationToken);
        if (column is null)
        {
            throw new NotFoundException(nameof(Column), id);
        }

        column.Title = dto.Title.Trim();
        column.ColorHex = dto.ColorHex;
        column.WipLimit = dto.WipLimit;

        await _columnRepository.UpdateAsync(column, cancellationToken);
        return MapToDto(column);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exists = await _columnRepository.ExistsAsync(id, cancellationToken);
        if (!exists)
        {
            throw new NotFoundException(nameof(Column), id);
        }

        await _columnRepository.DeleteAsync(id, cancellationToken);
    }

    private static ColumnDto MapToDto(Column column)
    {
        return new ColumnDto(
            column.Id,
            column.BoardId,
            column.Title,
            column.Position,
            column.ColorHex,
            column.WipLimit,
            column.TaskItems
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
                    t.TaskLabels.Where(tl => tl.Label is not null).Select(tl => new LabelDto(tl.Label.Id, tl.Label.Name, tl.Label.ColorHex)).ToList(),
                    t.CreatedAt))
                .ToList());
    }
}

