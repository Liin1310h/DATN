using ExpenseTrackerAPI.Application.DTOs;

namespace ExpenseTrackerAPI.Application.Interfaces.Admin;

public interface IAdminDashboardService
{
    Task<AdminDashboardDto> GetDashboardAsync();
}