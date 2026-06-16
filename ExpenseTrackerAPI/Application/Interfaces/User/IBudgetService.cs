using ExpenseTrackerAPI.Application.DTOs;

namespace ExpenseTrackerAPI.Application.Interfaces.User;

public interface IBudgetService
{
    Task<List<BudgetResponseDto>> GetBudgets(string month, int userId);
    Task UpsertBudget(CreateBudgetDto dto, int userId);
    Task ApplyExpenseAsync(int userId, int? categoryId, DateTime transactionDate, decimal amount, string currency);
    Task RollbackExpenseAsync(int userId, int? categoryId, DateTime transactionDate, decimal amount, string currency);
    Task DeleteBudget(int id, int userId);
    Task CheckBudgetAlertAsync(int userId, int? categoryId, DateTime transactionDate);
}