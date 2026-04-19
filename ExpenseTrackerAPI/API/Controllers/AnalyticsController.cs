using Microsoft.AspNetCore.Mvc;
using ExpenseTrackerAPI.Application.Interfaces;
using System.Security.Claims;

namespace ExpenseTrackerAPI.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService service)
    {
        _analyticsService = service;
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");


    [HttpGet("chart")]
    public async Task<IActionResult> GetChart(string currency, [FromQuery] string range = "week")
    {
        var userId = GetUserId();

        var result = await _analyticsService.GetChartAsync(userId, range, currency);

        return Ok(result);
    }

    [HttpGet("chart/category")]
    public async Task<IActionResult> GetCategoryChart(string currency, [FromQuery] string range = "week")
    {
        var userId = GetUserId();
        var result = await _analyticsService.GetCategoryChartAsync(userId, range, currency);
        return Ok(result);
    }

    [HttpGet("daily-summary")]
    public async Task<IActionResult> GetDailySummary(string currency, [FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
    {
        var result = await _analyticsService.GetDailySummaryAsync(
            GetUserId(),
            fromDate,
            toDate,
            currency
        );

        return Ok(result);
    }
}