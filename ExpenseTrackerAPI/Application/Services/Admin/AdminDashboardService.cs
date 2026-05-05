using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Application.Interfaces.Admin;
using ExpenseTrackerAPI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Application.Services.Admin;

public class AdminDashboardService : IAdminDashboardService
{
    private readonly AppDbContext _context;

    public AdminDashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminDashboardDto> GetDashboardAsync()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        return new AdminDashboardDto
        {
            TotalUsers = await _context.Users.CountAsync(),
            ActiveUsers = await _context.Users.CountAsync(x => x.IsActive),
            NewUsersThisMonth = await _context.Users.CountAsync(x => x.CreatedAt >= monthStart),

            TotalTransactions = await _context.Transactions.CountAsync(),
            TotalBudgets = await _context.Budgets.CountAsync(),
            ActiveLoans = await _context.Loans.CountAsync(x => !x.IsCompleted),

            SystemCategories = await _context.Categories.CountAsync(x => x.UserId == null),
            UserCategories = await _context.Categories.CountAsync(x => x.UserId != null)
        };
    }
}