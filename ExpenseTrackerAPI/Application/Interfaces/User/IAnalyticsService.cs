using ExpenseTrackerAPI.Application.DTOs;

namespace ExpenseTrackerAPI.Application.Interfaces.User;

public interface IAnalyticsService
{
    Task<TransactionChartDto> GetChartAsync(int userId, string range, string currency);
    Task<CategoryChartDto> GetCategoryChartAsync(int userId, string range, string currency);
    Task<TransactionChartDto> GetDailySummaryAsync(int userId, DateTime fromDate, DateTime toDate, string currency);
}