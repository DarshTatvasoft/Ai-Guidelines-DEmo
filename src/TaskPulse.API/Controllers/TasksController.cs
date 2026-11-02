using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskPulse.API.Common;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Interfaces;

namespace TaskPulse.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    /// <summary>
    /// Retrieves a task card by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<TaskItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var task = await _taskService.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<TaskItemDto>.Ok(task));
    }

    /// <summary>
    /// Creates a new task card inside a specified column.
    /// </summary>
    [HttpPost("column/{columnId:guid}")]
    [HttpPost("/api/v1/columns/{columnId:guid}/tasks")]
    [ProducesResponseType(typeof(ApiResponse<TaskItemDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(
        Guid columnId,
        [FromBody] CreateTaskDto dto,
        CancellationToken cancellationToken)
    {
        var created = await _taskService.CreateAsync(columnId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<TaskItemDto>.Ok(created, "Task created successfully."));
    }

    /// <summary>
    /// Updates details of an existing task card.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<TaskItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateTaskDto dto,
        CancellationToken cancellationToken)
    {
        var updated = await _taskService.UpdateAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<TaskItemDto>.Ok(updated, "Task updated successfully."));
    }

    /// <summary>
    /// Moves a task to a new position or into another column (drag-and-drop).
    /// </summary>
    [HttpPatch("{id:guid}/move")]
    [ProducesResponseType(typeof(ApiResponse<TaskItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Move(
        Guid id,
        [FromBody] MoveTaskDto dto,
        CancellationToken cancellationToken)
    {
        var moved = await _taskService.MoveAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<TaskItemDto>.Ok(moved, "Task moved successfully."));
    }

    /// <summary>
    /// Soft deletes a task card and rebalances remaining tasks in the column.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _taskService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { id }, "Task deleted successfully."));
    }
}
