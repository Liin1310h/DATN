using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.DTOs;
using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;

namespace ExpenseTrackerAPI.Services;

public class DashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardDto> GetDashboardAsync(int userId)
    {
        var data = await _context.Transactions.Where(t => t.UserId == userId).GroupBy(t => 1).Select(g => new DashboardDto
        {
            TotalIncome = g.Where(t => t.Type == "income").Sum(t => (decimal?)(t.ConvertedAmount ?? t.Amount)) ?? 0,
            TotalExpense = g.Where(t => t.Type == "expense").Sum(t => (decimal?)(t.ConvertedAmount ?? t.Amount)) ?? 0,
            TransactionCount = g.Count()
        }).SingleOrDefaultAsync();
        data ??= new DashboardDto();

        data.Balance = data.TotalIncome - data.TotalExpense;
        return data;
    }

    public async Task<List<Transaction>> GetRecentAsync(int userId)
    {
        return await _context.Transactions.Where(t => t.UserId == userId).OrderByDescending(t => t.TransactionDate).Take(5).ToListAsync();
    }
}