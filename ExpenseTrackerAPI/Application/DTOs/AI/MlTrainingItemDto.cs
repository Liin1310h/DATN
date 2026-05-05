namespace ExpenseTrackerAPI.Application.Interfaces.AI;

public class MlTrainingItemDto
{
    public string Note { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int CategoryId { get; set; }
}