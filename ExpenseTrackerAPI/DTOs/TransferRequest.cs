namespace ExpenseTrackerAPI.DTOs;

public class TransferRequest
{
    public decimal Amount { get; set; } //Tiền gốc
    public decimal ConvertedAmount { get; set; } //Số tiền sau khi quy đổi
    public string Note { get; set; } = String.Empty;
    public DateTime TransactionDate { get; set; }
    public int FromAccountId { get; set; }
    public int ToAccountId { get; set; }
}