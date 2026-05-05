namespace ExpenseTrackerAPI.Application.Interfaces.AI;

public class MlPredictResponseDto
{
    public int? CategoryId { get; set; }
    public double Confidence { get; set; }
    public string Source { get; set; } = "ml_global";
}