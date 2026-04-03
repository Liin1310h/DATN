using System.Security.Claims;
using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.DTOs;
using ExpenseTrackerAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Services;
namespace ExpenseTrackerAPI.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class LoansController : ControllerBase
{
    private readonly ILoanService _loanService;
    public LoansController(ILoanService loanService)
    {
        _loanService = loanService;
    }
    // TODO Helper
    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    // TODO: Tạo khoản vay mới
    [HttpPost]
    public async Task<IActionResult> CreateLoan([FromBody] LoanRequest request)
    {
        try
        {
            var loan = await _loanService.CreateLoanAsync(request, GetUserId());
            return Ok(new { Message = "Khoản vay được tạo thành công", Data = loan });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    // TODO: Trả nợ cho khoản vay
    [HttpPost("repay")]
    public async Task<IActionResult> RepayLoan([FromBody] RepaymentRequest request)
    {
        try
        {
            var transaction = await _loanService.ProcessRepaymentAsync(request, GetUserId());
            return Ok(new { Message = "Trả nợ thành công", Transaction = transaction });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    // TODO: Lấy danh sách khoản vay của user
    [HttpGet]
    public async Task<IActionResult> GetUserLoans([FromQuery] bool? isCompleted)
    {
        var loans = await _loanService.GetUserLoansAsync(GetUserId(), isCompleted);
        return Ok(loans);
    }

    // TODO: Lấy chi tiết 1 khoản vay kèm lịch sử giao dịch của nó
    [HttpGet("{loanId}")]
    public async Task<IActionResult> GetLoanDetails(int loanId)
    {
        var loan = await _loanService.GetLoanDetailsAsync(loanId, GetUserId());
        if (loan == null)
        {
            return NotFound(new { Message = "Khoản vay không tồn tại" });
        }
        return Ok(loan);
    }
}
