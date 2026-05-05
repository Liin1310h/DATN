using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Application.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTrackerAPI.API.Controllers.Admin;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _adminUserService;

    public AdminUsersController(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] string? search)
    {
        var result = await _adminUserService.GetUsersAsync(search);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserById(int id)
    {
        var result = await _adminUserService.GetUserByIdAsync(id);
        if (result == null)
            return NotFound(new { message = "User không tồn tại." });

        return Ok(result);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] AdminUpdateUserStatusRequest request)
    {
        await _adminUserService.UpdateUserStatusAsync(id, request.IsActive);
        return NoContent();
    }

    [HttpPut("{id}/role")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] AdminUpdateUserRoleRequest request)
    {
        await _adminUserService.UpdateUserRoleAsync(id, request.Role);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> SoftDeleteUser(int id)
    {
        await _adminUserService.SoftDeleteUserAsync(id);
        return NoContent();
    }
}