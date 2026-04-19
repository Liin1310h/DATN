using System.Security.Claims;
using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Application.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTrackerAPI.API.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;
    public SettingsController(ISettingsService settingsService) => _settingsService = settingsService;

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await _settingsService.GetOrCreateSettingsAsync(GetUserId());
        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] UserSetting settingsDto)
    {
        try
        {
            await _settingsService.UpdateSettingsAsync(settingsDto, GetUserId());
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}