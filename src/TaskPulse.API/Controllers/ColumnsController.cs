using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskPulse.API.Common;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Interfaces;

namespace TaskPulse.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class ColumnsController : ControllerBase
{
    private readonly IColumnService _columnService;

    public ColumnsController(IColumnService columnService)
    {
        _columnService = columnService;
    }

    /// <summary>
    /// Gets all columns for a given board.
    /// </summary>
    [HttpGet("board/{boardId:guid}")]
    [HttpGet("/api/v1/boards/{boardId:guid}/columns")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ColumnDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByBoardId(Guid boardId, CancellationToken cancellationToken)
    {
        var columns = await _columnService.GetByBoardIdAsync(boardId, cancellationToken);
        return Ok(ApiResponse<IEnumerable<ColumnDto>>.Ok(columns));
    }

    /// <summary>
    /// Adds a new column to a board.
    /// </summary>
    [HttpPost("board/{boardId:guid}")]
    [HttpPost("/api/v1/boards/{boardId:guid}/columns")]
    [ProducesResponseType(typeof(ApiResponse<ColumnDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(Guid boardId, [FromBody] CreateColumnDto dto, CancellationToken cancellationToken)
    {
        var created = await _columnService.CreateAsync(boardId, dto, cancellationToken);
        return Created($"/api/v1/columns/{created.Id}", ApiResponse<ColumnDto>.Ok(created, "Column created successfully."));
    }

    /// <summary>
    /// Updates an existing column's title, color, or WIP limit.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ColumnDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateColumnDto dto, CancellationToken cancellationToken)
    {
        var updated = await _columnService.UpdateAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<ColumnDto>.Ok(updated, "Column updated successfully."));
    }

    /// <summary>
    /// Soft deletes a column.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _columnService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { id }, "Column deleted successfully."));
    }
}
