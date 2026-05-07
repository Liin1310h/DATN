// Application/DTOs/Ocr/CreateTransactionsFromReceiptRequest.cs

namespace ExpenseTrackerAPI.Application.DTOs.Ocr;

public class CreateTransactionsFromReceiptRequest
{
    public int DefaultAccountId { get; set; }

    public List<CreateReceiptTransactionItemDto> Transactions { get; set; } = new();
}