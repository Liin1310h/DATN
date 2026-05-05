using System.Security.Claims;
using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Application.Interfaces.User;

using Microsoft.AspNetCore.Mvc;

namespace ExpenseTrackerAPI.API.Controllers.User;

// [Authorize]
[Route("api/[controller]")]
[ApiController]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transService;
    public TransactionsController(ITransactionService transService) => _transService = transService;

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TransactionRequest request)
    {
        try { return Ok(await _transService.CreateTransactionAsync(request, GetUserId())); }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] TransactionRequest request)
    {
        try
        {
            return Ok(await _transService.UpdateTransactionAsync(id, request, GetUserId()));
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _transService.DeleteTransactionAsync(id, GetUserId()); return Ok("Deleted"); }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer(TransferRequest request)
    {
        try { return Ok(await _transService.TransferAsync(request, GetUserId())); }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpGet]
    public async Task<IActionResult> GetHistory([FromQuery] int? accountId,
    [FromQuery] string? type,
    [FromQuery] int? categoryId,
    [FromQuery] DateTime? fromDate,
    [FromQuery] DateTime? toDate,
    [FromQuery] string? searchQuery,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20
    )
    {
        return Ok(await _transService.GetHistoryAsync(GetUserId(), accountId, type, categoryId, fromDate, toDate, searchQuery, null, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTransactionById([FromQuery] int id)
    {
        return Ok(await _transService.GetTransactionByIdAsync(id, GetUserId()));
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(int? accountId, int? categoryId, DateTime? fromDate, DateTime? toDate
)
    {
        var userId = GetUserId();

        var file = await _transService.ExportTransactionsToExcelAsync(
            userId, accountId, categoryId, fromDate, toDate);

        return File(
            file,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "transactions.xlsx"
        );
    }

}