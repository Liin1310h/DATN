namespace ExpenseTrackerAPI.Application.DTOs.AI;

public class SemanticCategoryItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Keywords { get; set; }
}