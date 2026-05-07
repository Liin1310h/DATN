using ExpenseTrackerAPI.Application.DTOs.Ocr;
using ExpenseTrackerAPI.Application.Interfaces.OCR;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ExpenseTrackerAPI.Controllers.OCR;

[ApiController]
[Route("api/receipt-ocr")]
public class ReceiptOcrController : ControllerBase
{
    private readonly IReceiptProcessingService _processingService;
    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    public ReceiptOcrController(IReceiptProcessingService processingService)
    {
        _processingService = processingService;
    }

    [HttpPost("parse")]
    public async Task<IActionResult> Parse([FromBody] OcrResponseDto ocrResult)
    {
        int userId = GetUserId(); // TODO: lấy từ JWT

        var result = await _processingService.ProcessAsync(userId, ocrResult);

        return Ok(result);
    }
}
