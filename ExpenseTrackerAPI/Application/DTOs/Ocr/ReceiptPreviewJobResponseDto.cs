namespace ExpenseTrackerAPI.Application.DTOs.Ocr;

public class ReceiptPreviewJobResponseDto
{
    public bool Success { get; set; }
    public string JobId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}