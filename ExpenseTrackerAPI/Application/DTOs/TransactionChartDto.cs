namespace ExpenseTrackerAPI.Application.DTOs;

public class TransactionChartDto
{
    public List<string> Labels { get; set; } = new(); //Date
    public List<decimal> Expenses { get; set; } = new();
    public List<decimal> Incomes { get; set; } = new();
}