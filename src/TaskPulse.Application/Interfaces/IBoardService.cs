using TaskPulse.Application.DTOs;

namespace TaskPulse.Application.Interfaces;

public interface IBoardService
{
    Task<IEnumerable<BoardSummaryDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<BoardDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<BoardDetailDto> CreateAsync(CreateBoardDto dto, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

