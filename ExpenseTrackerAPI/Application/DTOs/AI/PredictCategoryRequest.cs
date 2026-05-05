namespace ExpenseTrackerAPI.Application.DTOs.AI;

public class PredictCategoryRequest
{
    public string Note { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Type { get; set; } = "expense";
}