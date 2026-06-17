// Application/DTOs/Ocr/ReceiptTransactionPreviewDto.cs

using ExpenseTrackerAPI.Domain.Enums;

namespace ExpenseTrackerAPI.Application.DTOs.Ocr;

public class ReceiptTransactionPreviewDto
{
    public string TempId { get; set; } = Guid.NewGuid().ToString();

    public bool Selected { get; set; } = true;

    public TransactionType Type { get; set; } = TransactionType.Expense;

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "VND";

    public DateTime TransactionDate { get; set; }

    public string Note { get; set; } = "";

    public int? CategoryId { get; set; }

    public string? CategoryName { get; set; }

    public double? CategoryConfidence { get; set; }

    public decimal? Quantity { get; set; }

    public decimal? UnitPrice { get; set; }

    public string? Merchant { get; set; }
}