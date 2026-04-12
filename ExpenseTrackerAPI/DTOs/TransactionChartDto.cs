namespace ExpenseTrackerAPI.DTOs;

public class TransactionChartDto
{
    public List<string> Labels { get; set; } = new();
    public List<decimal> Expenses { get; set; } = new();
    public List<decimal> Incomes { get; set; } = new();
}