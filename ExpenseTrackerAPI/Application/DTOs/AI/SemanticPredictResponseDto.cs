namespace ExpenseTrackerAPI.Application.DTOs.AI;

public class SemanticPredictResponseDto
{
    public int? CategoryId { get; set; }
    public double Confidence { get; set; }
    public string Source { get; set; } = "semantic";
    public string? Reason { get; set; }
}