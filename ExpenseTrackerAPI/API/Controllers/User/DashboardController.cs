using Microsoft.AspNetCore.Mvc;
using ExpenseTrackerAPI.Application.Interfaces.User;
using System.Security.Claims;

namespace ExpenseTrackerAPI.API.Controllers.User;

[Route("api/[controller]")]
[ApiController]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService service)
    {
        _dashboardService = service;
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    public async Task<IActionResult> GetDashboard(string currency)
    {
        var result = await _dashboardService.GetDashboardAsync(GetUserId(), currency);
        return Ok(result);
    }


    [HttpGet("recent")]
    public async Task<IActionResult> GetRecent()
    {
        var result = await _dashboardService.GetRecentAsync(GetUserId());
        return Ok(result);
    }
}