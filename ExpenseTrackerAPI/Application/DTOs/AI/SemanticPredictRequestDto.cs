namespace ExpenseTrackerAPI.Application.DTOs.AI;

public class SemanticPredictRequestDto
{
    public string Note { get; set; } = string.Empty;
    public string Type { get; set; } = "expense";
    public decimal Amount { get; set; }

    public List<SemanticCategoryItemDto> Categories { get; set; } = new();
}