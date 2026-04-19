using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Infrastructure.Data;
using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Application.Interfaces;

namespace ExpenseTrackerAPI.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;
    private readonly ICurrencyService _currencyService;
    public DashboardService(AppDbContext context, ICurrencyService currencyService)
    {
        _context = context;
        _currencyService = currencyService;
    }

    public async Task<DashboardDto> GetDashboardAsync(int userId, string currency)
    {
        var transactions = await _context.Transactions
            .Where(t => t.UserId == userId)
            .Select(t => new { t.Amount, t.Currency, t.Type })
            .ToListAsync();

        var rates = await _currencyService.GetRatesAsync(currency);

        decimal totalIncome = 0;
        decimal totalExpense = 0;

        foreach (var t in transactions)
        {
            decimal amount;

            if (t.Currency == currency)
            {
                amount = t.Amount;
            }
            else
            {
                if (!rates.ContainsKey(t.Currency))
                    throw new Exception($"Không có tỷ giá cho {t.Currency}");

                amount = t.Amount / rates[t.Currency];
            }

            if (t.Type == "income")
                totalIncome += amount;
            else if (t.Type == "expense")
                totalExpense += amount;
        }

        return new DashboardDto
        {
            TotalIncome = totalIncome,
            TotalExpense = totalExpense,
            TransactionCount = transactions.Count,
            Balance = totalIncome - totalExpense
        };
    }

    public async Task<List<Transaction>> GetRecentAsync(int userId)
    {
        return await _context.Transactions.Where(t => t.UserId == userId).OrderByDescending(t => t.TransactionDate).Take(5).ToListAsync();
    }
}