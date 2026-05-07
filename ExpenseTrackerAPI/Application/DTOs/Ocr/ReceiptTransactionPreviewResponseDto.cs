// Application/DTOs/Ocr/ReceiptTransactionPreviewResponseDto.cs

namespace ExpenseTrackerAPI.Application.DTOs.Ocr;

public class ReceiptTransactionPreviewResponseDto
{
    public bool Success { get; set; }

    /// <summary>
    /// processing | done | failed
    /// </summary>
    public string Status { get; set; } = "processing";

    public string? JobId { get; set; }

    public string? Error { get; set; }

    public ReceiptTransactionPreviewDataDto? Data { get; set; }

}