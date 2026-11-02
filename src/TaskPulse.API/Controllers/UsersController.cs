using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskPulse.API.Common;
using TaskPulse.Application.DTOs;
using TaskPulse.Application.Interfaces;

namespace TaskPulse.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Retrieves all registered users for task assignment.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<UserDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var users = await _userService.GetAllAsync(cancellationToken);
        return Ok(ApiResponse<IEnumerable<UserDto>>.Ok(users));
    }

    /// <summary>
    /// Assigns or unassigns a user to a task card. Pass a null UserId to unassign.
    /// </summary>
    [HttpPatch("/api/v1/tasks/{taskId:guid}/assign")]
    [HttpPatch("tasks/{taskId:guid}/assign")]
    [ProducesResponseType(typeof(ApiResponse<TaskItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignUser(
        Guid taskId,
        [FromBody] AssignUserDto dto,
        CancellationToken cancellationToken)
    {
        var updatedTask = await _userService.AssignTaskUserAsync(taskId, dto, cancellationToken);
        var message = dto.UserId.HasValue ? "User assigned to task successfully." : "User unassigned from task successfully.";
        return Ok(ApiResponse<TaskItemDto>.Ok(updatedTask, message));
    }
}

