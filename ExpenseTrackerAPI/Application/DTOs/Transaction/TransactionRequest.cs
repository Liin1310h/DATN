namespace ExpenseTrackerAPI.Application.DTOs;

public class TransactionRequest
{
    public string Currency { get; set; } = String.Empty;
    required
    public decimal Amount
    { get; set; }
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
    public LoanUpdateRequest? Loan { get; set; }
}