using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskPulse.API.Common;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Interfaces;

namespace TaskPulse.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class BoardsController : ControllerBase
{
    private readonly IBoardService _boardService;

    public BoardsController(IBoardService boardService)
    {
        _boardService = boardService;
    }

    /// <summary>
    /// Retrieves all active boards with column and task summaries.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<BoardSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var boards = await _boardService.GetAllAsync(cancellationToken);
        return Ok(ApiResponse<IEnumerable<BoardSummaryDto>>.Ok(boards));
    }

    /// <summary>
    /// Retrieves a single board by ID including all columns, task cards, and labels.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<BoardDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var board = await _boardService.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<BoardDetailDto>.Ok(board));
    }

    /// <summary>
    /// Creates a new Kanban board with default To Do, In Progress, and Done columns.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<BoardDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateBoardDto dto, CancellationToken cancellationToken)
    {
        var created = await _boardService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<BoardDetailDto>.Ok(created, "Board created successfully."));
    }

    /// <summary>
    /// Soft deletes a board.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _boardService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { id }, "Board deleted successfully."));
    }
}

