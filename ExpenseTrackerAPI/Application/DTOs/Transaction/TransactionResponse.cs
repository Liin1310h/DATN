
namespace ExpenseTrackerAPI.Application.DTOs;

public class TransactionResponse
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public required string Currency { get; set; }
    public required string Type { get; set; } // "income" hoặc "expense"
    public DateTime TransactionDate { get; set; }
    public string? Note { get; set; }

    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? CategoryIcon { get; set; }
    public string? CategoryColor { get; set; }

    public int? FromAccountId { get; set; }
    public int? ToAccountId { get; set; }
    public string? AccountName { get; set; }
    public LoanDto? Loan { get; set; }
}