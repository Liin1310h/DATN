namespace ExpenseTrackerAPI.DTOs;

public class CreateBudgetDto
{
    public int CategoryId { get; set; }
    public string Month { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
}