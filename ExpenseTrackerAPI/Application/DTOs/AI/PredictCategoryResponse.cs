namespace ExpenseTrackerAPI.Application.DTOs.AI;

public class PredictCategoryResponse
{
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public double Confidence { get; set; }
    public string Source { get; set; } = "none"; // "personal_rule", "ml_global","semantic","none"
    public string Message { get; set; } = string.Empty;
}