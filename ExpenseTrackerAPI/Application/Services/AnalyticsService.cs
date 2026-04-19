using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Infrastructure.Data;
using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Application.Interfaces;

namespace ExpenseTrackerAPI.Application.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly AppDbContext _context;
    private readonly ICurrencyService _currencyService;
    public AnalyticsService(AppDbContext context, ICurrencyService currencyService)
    {
        _context = context;
        _currencyService = currencyService;
    }

    public async Task<TransactionChartDto> GetChartAsync(int userId, string range, string currency)
    {
        var now = DateTime.UtcNow;

        DateTime fromDate = range switch
        {
            "day" => now.Date,
            "week" => now.Date.AddDays(-6),
            "month" => now.Date.AddDays(-30),
            _ => now.Date.AddDays(-6)
        };

        var baseCurrency = currency;

        var data = await _context.Transactions
            .Where(t => t.UserId == userId && t.TransactionDate >= fromDate)
            .Select(t => new
            {
                Date = t.TransactionDate.Date,
                t.Type,
                t.Currency,
                t.Amount
            })
            .ToListAsync();

        var grouped = data
            .GroupBy(x => x.Date)
            .OrderBy(g => g.Key)
            .ToList();

        var result = new TransactionChartDto();
        var rates = await _currencyService.GetRatesAsync(baseCurrency);

        foreach (var g in grouped)
        {
            result.Labels.Add(g.Key.ToString("yyyy-MM-dd"));

            // Tính expense
            decimal dailyExpense = 0;
            foreach (var item in g.Where(x => x.Type == "expense"))
            {
                if (!rates.ContainsKey(item.Currency))
                {
                    throw new Exception($"Không tìm thấy tỷ giá cho {item.Currency}");
                }
                var amount = item.Currency == baseCurrency ? item.Amount : item.Amount / rates[item.Currency];
                dailyExpense += amount;
            }
            result.Expenses.Add(dailyExpense);

            // Tính income
            decimal dailyIncome = 0;
            foreach (var item in g.Where(x => x.Type == "income"))
            {
                if (!rates.ContainsKey(item.Currency))
                {
                    throw new Exception($"Không tìm thấy tỷ giá cho {item.Currency}");
                }

                var amount = item.Currency == baseCurrency ? item.Amount : item.Amount / rates[item.Currency];
                dailyIncome += amount;
            }
            result.Incomes.Add(dailyIncome);
        }

        return result;
    }

    public async Task<CategoryChartDto> GetCategoryChartAsync(int userId, string range, string currency)
    {
        var now = DateTime.UtcNow;

        DateTime fromDate = range switch
        {
            "day" => now.Date,
            "week" => now.Date.AddDays(-6),
            "month" => now.Date.AddDays(-30),
            _ => now.Date.AddDays(-6)
        };

        var baseCurrency = currency;

        var data = await _context.Transactions
            .Where(t => t.UserId == userId
                     && t.TransactionDate >= fromDate
                     && t.Type == "expense")
            .Include(t => t.Category)
            .Select(t => new
            {
                CategoryName = t.Category != null ? t.Category.Name : "Khác",
                t.Currency,
                t.Amount
            })
            .ToListAsync();

        var grouped = data
            .GroupBy(x => x.CategoryName);

        var result = new CategoryChartDto();
        var rates = await _currencyService.GetRatesAsync(baseCurrency);
        foreach (var group in grouped)
        {
            decimal total = 0;

            foreach (var item in group)
            {
                decimal amount;

                if (item.Currency == baseCurrency)
                {
                    amount = item.Amount;
                }
                else
                {
                    if (!rates.ContainsKey(item.Currency))
                    {
                        throw new Exception($"Không tìm thấy tỷ giá cho {item.Currency}");
                    }

                    amount = item.Amount / rates[item.Currency];
                }
                total += amount;
            }

            result.Labels.Add(group.Key);
            result.Values.Add(total);
        }

        return result;
    }

    public async Task<List<Transaction>> GetRecentAsync(int userId)
    {
        return await _context.Transactions.Where(t => t.UserId == userId).OrderByDescending(t => t.TransactionDate).Take(5).ToListAsync();
    }

    /// <summary>
    /// Hàm lấy tổng expense, income theo ngày
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="fromDate"></param>
    /// <param name="toDate"></param>
    /// <param name="currency"></param>
    /// <returns></returns>
    public async Task<TransactionChartDto> GetDailySummaryAsync(int userId, DateTime fromDate, DateTime toDate, string currency)
    {
        var baseCurrency = currency;
        var data = await _context.Transactions.Where(t => t.UserId == userId && t.TransactionDate >= fromDate && t.TransactionDate <= toDate).Select(t => new
        {
            Date = t.TransactionDate.Date,
            t.Type,
            t.Currency,
            t.Amount
        }).ToListAsync();

        var grouped = data.GroupBy(x => x.Date).OrderBy(g => g.Key);

        var rates = await _currencyService.GetRatesAsync(baseCurrency);
        var result = new TransactionChartDto();

        foreach (var g in grouped)
        {
            result.Labels.Add(g.Key.ToString("yyyy-MM-dd"));

            decimal income = 0;
            decimal expense = 0;

            foreach (var item in g)
            {
                if (string.IsNullOrEmpty(item.Currency) || !rates.ContainsKey(item.Currency))
                    continue;

                var amount = item.Currency == baseCurrency
                    ? item.Amount
                    : item.Amount / rates[item.Currency];

                if (item.Type == "income")
                    income += amount;
                else if (item.Type == "expense")
                    expense += amount;
            }

            result.Incomes.Add(income);
            result.Expenses.Add(expense);
        }

        return result;
    }
}