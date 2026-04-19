using System.Security.Claims;
using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTrackerAPI.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BudgetController : ControllerBase
{
    private readonly IBudgetService _service;

    public BudgetController(IBudgetService service)
    {
        _service = service;
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    public async Task<IActionResult> Get(string month)
    {
        int userId = GetUserId(); // từ token
        var result = await _service.GetBudgets(month, userId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert(CreateBudgetDto dto)
    {
        int userId = GetUserId();
        await _service.UpsertBudget(dto, userId);
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        int userId = GetUserId();
        await _service.DeleteBudget(id, userId);
        return Ok();
    }
}