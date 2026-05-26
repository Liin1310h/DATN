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

    /// <summary>
    /// Lấy số liệu tổng quan cho dashboard của admin
    /// </summary>
    /// <returns></returns>
    public async Task<AdminDashboardDto> GetDashboardAsync()
    {
        // Lấy thời gian
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var sixMonthsAgo = monthStart.AddMonths(-5);

        var totalUsers = await _context.Users.CountAsync();
        var activeUsers = await _context.Users.CountAsync(x => x.IsActive);

        var monthlyUsers = await GetMonthlyUsersAsync(sixMonthsAgo, monthStart);
        var monthlyTransactions = await GetMonthlyTransactionsAsync(
            sixMonthsAgo,
            monthStart
        );

        var topUsers = await GetTopUsersAsync();

        return new AdminDashboardDto
        {
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            InactiveUsers = totalUsers - activeUsers,
            NewUsersThisMonth = await _context.Users.CountAsync(x => x.CreatedAt >= monthStart),

            TotalTransactions = await _context.Transactions.CountAsync(),
            TotalBudgets = await _context.Budgets.CountAsync(),
            ActiveLoans = await _context.Loans.CountAsync(x => !x.IsCompleted),

            SystemCategories = await _context.Categories.CountAsync(x => x.UserId == null),
            UserCategories = await _context.Categories.CountAsync(x => x.UserId != null),

            MonthlyUsers = monthlyUsers,
            MonthlyTransactions = monthlyTransactions,
            TopUsers = topUsers
        };
    }

    /// <summary>
    /// Lấy số lượng người dùng mới theo tháng trong 6 tháng gần nhất
    /// </summary>
    /// <param name="sixMonthsAgo"></param>
    /// <param name="currentMonthStart"></param>
    /// <returns></returns>
    private async Task<List<MonthlyStatDto>> GetMonthlyUsersAsync(DateTime sixMonthsAgo, DateTime currentMonthStart)
    {
        var rawData = await _context.Users
            .Where(x => x.CreatedAt >= sixMonthsAgo)
            .GroupBy(x => new
            {
                x.CreatedAt.Year,
                x.CreatedAt.Month
            })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                Count = g.Count()
            })
            .ToListAsync();

        var result = new List<MonthlyStatDto>();

        for (var i = 0; i < 6; i++)
        {
            var month = currentMonthStart.AddMonths(-5 + i);

            var matched = rawData.FirstOrDefault(x =>
                x.Year == month.Year &&
                x.Month == month.Month
            );

            result.Add(new MonthlyStatDto
            {
                Label = month.ToString("MM/yyyy"),
                Value = matched?.Count ?? 0
            });
        }

        return result;
    }

    /// <summary>
    /// Lấy số lượng giao dịch theo tháng trong 6 tháng gần nhất
    /// </summary>
    /// <param name="sixMonthsAgo"></param>
    /// <param name="currentMonthStart"></param>
    /// <returns></returns>
    private async Task<List<MonthlyStatDto>> GetMonthlyTransactionsAsync(
        DateTime sixMonthsAgo,
        DateTime currentMonthStart
    )
    {
        var rawData = await _context.Transactions
            .Where(x => x.TransactionDate >= sixMonthsAgo)
            .GroupBy(x => new
            {
                x.TransactionDate.Year,
                x.TransactionDate.Month
            })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                Count = g.Count()
            })
            .ToListAsync();

        var result = new List<MonthlyStatDto>();

        for (var i = 0; i < 6; i++)
        {
            var month = currentMonthStart.AddMonths(-5 + i);

            var matched = rawData.FirstOrDefault(x =>
                x.Year == month.Year &&
                x.Month == month.Month
            );

            result.Add(new MonthlyStatDto
            {
                Label = month.ToString("MM/yyyy"),
                Value = matched?.Count ?? 0
            });
        }

        return result;
    }

    /// <summary>
    /// Lấy danh sách người dùng hàng đầu dựa trên số lượng giao dịch
    /// </summary>
    /// <returns></returns>
    private async Task<List<TopUserDto>> GetTopUsersAsync()
    {
        return await _context.Users
            .Where(x => x.Role == "User")
            .Select(u => new TopUserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,

                TransactionCount = _context.Transactions.Count(t => t.UserId == u.Id),
                AccountCount = _context.Accounts.Count(a => a.UserId == u.Id),
                BudgetCount = _context.Budgets.Count(b => b.UserId == u.Id),
                LoanCount = _context.Loans.Count(l => l.UserId == u.Id)
            })
            .OrderByDescending(x => x.TransactionCount)
            .ThenByDescending(x => x.AccountCount)
            .Take(5)
            .ToListAsync();
    }
}