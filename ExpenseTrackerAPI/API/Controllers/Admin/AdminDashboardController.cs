using ExpenseTrackerAPI.Application.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTrackerAPI.API.Controllers.Admin;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "Admin")]
public class AdminDashboardController : ControllerBase
{
    private readonly IAdminDashboardService _adminDashboardService;

    public AdminDashboardController(IAdminDashboardService adminDashboardService)
    {
        _adminDashboardService = adminDashboardService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _adminDashboardService.GetDashboardAsync();
        return Ok(result);
    }
}