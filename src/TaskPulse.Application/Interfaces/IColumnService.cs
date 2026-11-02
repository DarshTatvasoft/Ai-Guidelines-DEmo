using TaskPulse.Application.DTOs;

namespace TaskPulse.Application.Interfaces;

public interface IColumnService
{
    Task<IEnumerable<ColumnDto>> GetByBoardIdAsync(Guid boardId, CancellationToken cancellationToken = default);

    Task<ColumnDto> CreateAsync(Guid boardId, CreateColumnDto dto, CancellationToken cancellationToken = default);

    Task<ColumnDto> UpdateAsync(Guid id, UpdateColumnDto dto, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

