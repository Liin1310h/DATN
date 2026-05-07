namespace ExpenseTrackerAPI.Application.DTOs.Ocr;

public class ReceiptTransactionPreviewDataDto
{
    public string? Merchant { get; set; }
    public DateTime? TransactionDate { get; set; }
    public decimal? TotalAmount { get; set; }
    public string Currency { get; set; } = "VND";

    public string? RawText { get; set; }

    public double OcrConfidence { get; set; }
    public double ParseConfidence { get; set; }

    public List<ReceiptTransactionPreviewDto> Transactions { get; set; } = new();
}