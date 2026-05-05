using System.Security.Claims;
using ExpenseTrackerAPI.Application.DTOs.AI;
using ExpenseTrackerAPI.Application.Interfaces.AI;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTrackerAPI.API.Controllers.AI;

[ApiController]
[Route("api/ai/[controller]")]
[Authorize(Roles = "Admin")]
public class GlobalCategoryModelController : ControllerBase
{
    private readonly IGlobalCategoryMlService _mlService;

    public GlobalCategoryModelController(IGlobalCategoryMlService mlService)
    {
        _mlService = mlService;
    }

    [HttpPost("train")]
    public async Task<IActionResult> Train()
    {
        await _mlService.TrainAsync();
        return Ok(new { message = "Train Python ML global thành công." });
    }
}