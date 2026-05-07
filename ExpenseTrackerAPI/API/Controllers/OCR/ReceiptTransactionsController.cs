// Controllers/ReceiptTransactionsController.cs

using System.Security.Claims;
using ExpenseTrackerAPI.Application.DTOs.Ocr;
using ExpenseTrackerAPI.Application.Interfaces.OCR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTrackerAPI.Controllers;

[ApiController]
[Route("api/receipt-transactions")]
[Authorize]
public class ReceiptTransactionsController : ControllerBase
{
    private readonly IReceiptTransactionFlowService _flowService;

    public ReceiptTransactionsController(IReceiptTransactionFlowService flowService)
    {
        _flowService = flowService;
    }

    /// <summary>
    /// User upload ảnh hóa đơn.
    /// Backend OCR + parse + predict category.
    /// Trả về danh sách transaction preview, chưa tạo transaction thật.
    /// </summary>
    [HttpPost("preview")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Preview([FromForm] ReceiptUploadRequest request)
    {
        var userId = GetUserId();

        var result = await _flowService.PreviewAsync(userId, request.File);

        return Ok(result);
    }

    /// <summary>
    /// User gửi lại danh sách transaction đã chọn/sửa.
    /// Backend tạo transaction thật.
    /// </summary>
    [HttpPost("create")]
    public async Task<IActionResult> CreateTransactions(
        [FromBody] CreateTransactionsFromReceiptRequest request)
    {
        var userId = GetUserId();

        var result = await _flowService.CreateTransactionsAsync(userId, request);

        return Ok(new
        {
            success = true,
            message = "Tạo transaction từ hóa đơn thành công",
            transactions = result
        });
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(userIdClaim))
            throw new UnauthorizedAccessException("Không xác định được người dùng");

        return int.Parse(userIdClaim);
    }
}