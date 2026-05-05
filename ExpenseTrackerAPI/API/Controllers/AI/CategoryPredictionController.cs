using System.Security.Claims;
using ExpenseTrackerAPI.Application.DTOs.AI;
using ExpenseTrackerAPI.Application.Interfaces.AI;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTrackerAPI.API.Controllers.AI;

[ApiController]
[Route("api/ai/[controller]")]
[Authorize]
public class CategoryPredictionController : ControllerBase
{
    private readonly ICategoryPredictionService _predictionService;

    public CategoryPredictionController(ICategoryPredictionService predictionService)
    {
        _predictionService = predictionService;
    }

    [HttpPost("predict")]
    public async Task<IActionResult> Predict([FromBody] PredictCategoryRequest request)
    {
        var userIdRaw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdRaw, out var userId))
            return Unauthorized(new { message = "Token không hợp lệ." });

        var result = await _predictionService.PredictAsync(userId, request);
        return Ok(result);
    }
}