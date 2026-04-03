namespace ExpenseTrackerAPI.DTOs;

public class TransactionResponse
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; }
    public string Type { get; set; } // "income" hoặc "expense"
    public DateTime TransactionDate { get; set; }
    public string? Note { get; set; }
    public string? CategoryName { get; set; }
    public string? CategoryIcon { get; set; }
    public string? CategoryColor { get; set; }
    public string? AccountName { get; set; }
}