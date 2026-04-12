namespace ExpenseTrackerAPI.DTOs;

public class TransactionRequest
{
    public string Currency { get; set; } = String.Empty;
    required
    public decimal Amount
    { get; set; }
    public decimal? ConvertedAmount { get; set; } //Dùng cho trường hợp chuyển khoản giữa các tài khoản có loại tiền khác nhau
    required
    public string Type
    { get; set; } = String.Empty; // "Expense" hoặc "Income"
    public string? Note { get; set; } = String.Empty;
    required
    public int AccountId
    { get; set; }
    public DateTime? TransactionDate { get; set; }
    public int? CategoryId { get; set; }
    public int? LoanId { get; set; }
}