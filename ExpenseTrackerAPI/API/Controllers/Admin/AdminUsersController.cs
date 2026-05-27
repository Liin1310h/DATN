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

    /// <summary>
    /// Danh sách user
    /// </summary>
    /// <param name="query"></param>
    /// <returns></returns>
    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] AdminUserQueryDto query)
    {
        var result = await _adminUserService.GetUsersAsync(query);
        return Ok(result);
    }

    /// <summary>
    /// Chi tiết 1 user
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserById(int id)
    {
        var result = await _adminUserService.GetUserByIdAsync(id);
        if (result == null)
            return NotFound(new { message = "User không tồn tại." });

        return Ok(result);
    }

    /// <summary>
    /// Update trạng thái
    /// </summary>
    /// <param name="id"></param>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] AdminUpdateUserStatusRequest request)
    {
        await _adminUserService.UpdateUserStatusAsync(id, request.IsActive);
        return NoContent();
    }

    /// <summary>
    /// Update role
    /// </summary>
    /// <param name="id"></param>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPut("{id}/role")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] AdminUpdateUserRoleRequest request)
    {
        await _adminUserService.UpdateUserRoleAsync(id, request.Role);
        return NoContent();
    }

    /// <summary>
    /// Xoá mềm
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpDelete("{id}")]
    public async Task<IActionResult> SoftDeleteUser(int id)
    {
        await _adminUserService.SoftDeleteUserAsync(id);
        return NoContent();
    }
}