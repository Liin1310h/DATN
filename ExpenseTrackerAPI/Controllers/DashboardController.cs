using Microsoft.AspNetCore.Mvc;
using ExpenseTrackerAPI.Services;
using System.Security.Claims;
using System.Transactions;

namespace ExpenseTrackerAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _service;

    public DashboardController(DashboardService service)
    {
        _service = service;
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _service.GetDashboardAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("recent")]
    public async Task<IActionResult> GetRecent()
    {
        var result = await _service.GetRecentAsync(GetUserId());
        return Ok(result);
    }
}