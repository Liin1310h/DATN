using ExpenseTrackerAPI.Domain.Enums;

namespace ExpenseTrackerAPI.Application.DTOs.AI;

public class SemanticPredictRequestDto
{
    public string Note { get; set; } = string.Empty;
    public TransactionType Type { get; set; } = TransactionType.Expense;
    public decimal Amount { get; set; }

    public List<SemanticCategoryItemDto> Categories { get; set; } = new();
}