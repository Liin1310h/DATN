using ExpenseTrackerAPI.DTOs;

namespace ExpenseTrackerAPI.Services;

public interface IBudgetService
{
    Task<List<BudgetResponseDto>> GetBudgets(string month, int userId);
    Task UpsertBudget(CreateBudgetDto dto, int userId);
    Task DeleteBudget(int id, int userId);
}