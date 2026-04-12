namespace ExpenseTrackerAPI.DTOs;

public class BudgetResponseDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public string? CategoryIcon { get; set; }
    public decimal Amount
    { get; set; }
    public decimal Spent { get; set; }
    public string Currency { get; set; } = null!;
}