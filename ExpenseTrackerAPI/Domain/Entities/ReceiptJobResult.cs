using ExpenseTrackerAPI.Application.DTOs.Ocr;

namespace ExpenseTrackerAPI.Domain.Entities;
/// <summary>
/// Cache kết quả OCR + AI
/// </summary>
public class ReceiptJobResult
{
    public int Id { get; set; }
    public string JobId { get; set; } = string.Empty;
    public int UserId { get; set; }
    /// <summary>
    /// processing | done | failed
    /// </summary>
    public string Status { get; set; } = "processing";
    public string? Error { get; set; }
    public ReceiptTransactionPreviewDataDto? Data { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}