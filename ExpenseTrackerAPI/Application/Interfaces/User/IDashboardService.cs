using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Application.DTOs;

namespace ExpenseTrackerAPI.Application.Interfaces.User;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(int userId, string currency);
    Task<List<Transaction>> GetRecentAsync(int userId);
}