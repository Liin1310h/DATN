namespace ExpenseTrackerAPI.Application.Interfaces.AI;

public interface IPersonalCategoryRuleService
{
    Task LearnAsync(int userId, string? note, string type, int? categoryId);
    Task UnlearnAsync(int userId, string? note, string type, int? categoryId);
}