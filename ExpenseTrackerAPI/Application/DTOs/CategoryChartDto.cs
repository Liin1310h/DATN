namespace ExpenseTrackerAPI.Application.DTOs;

public class CategoryChartDto
{
    public List<string> Labels { get; set; } = new();
    public List<decimal> Values { get; set; } = new();
}