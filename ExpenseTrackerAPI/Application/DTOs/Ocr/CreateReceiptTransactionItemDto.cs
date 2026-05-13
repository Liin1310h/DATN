// Application/DTOs/Ocr/CreateReceiptTransactionItemDto.cs

namespace ExpenseTrackerAPI.Application.DTOs.Ocr;

public class CreateReceiptTransactionItemDto
{
    public bool Selected { get; set; } = true;

    public string Type { get; set; } = "expense";

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "VND";

    public DateTime TransactionDate { get; set; }

    public string Note { get; set; } = "";

    public int? CategoryId { get; set; }

    public int? FromAccountId { get; set; }
}