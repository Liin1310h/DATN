using ExpenseTrackerAPI.Infrastructure.Data;
using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Application.Interfaces;

namespace ExpenseTrackerAPI.Application.Services;

public class BudgetService : IBudgetService
{
    private readonly AppDbContext _context;
    public BudgetService(AppDbContext context) => _context = context;

    public async Task<List<BudgetResponseDto>> GetBudgets(string month, int userId)
    {
        var budgets = await _context.Budgets
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.Month == month)
            .ToListAsync();

        // parse month → date range
        var localStart = DateTime.Parse($"{month}-01");
        var start = DateTime.SpecifyKind(localStart, DateTimeKind.Utc);
        var end = start.AddMonths(1);

        // group transactions
        var expenses = await _context.Transactions
            .Where(t => t.UserId == userId
                && t.Type == "expense"
                && t.TransactionDate >= start
                && t.TransactionDate < end)
            .GroupBy(t => t.CategoryId)
            .Select(g => new
            {
                CategoryId = g.Key,
                Spent = g.Sum(x => x.Amount)
            })
            .ToListAsync();

        return budgets.Select(b =>
        {
            var spent = expenses
                .FirstOrDefault(e => e.CategoryId == b.CategoryId)?.Spent ?? 0;

            return new BudgetResponseDto
            {
                Id = b.Id,
                CategoryId = b.CategoryId,
                CategoryName = b.Category.Name ?? "N/A",
                CategoryIcon = b.Category.Icon ?? "Tag",
                Amount = b.Amount,
                Spent = Math.Abs(spent),
                Currency = b.Currency
            };
        }).ToList();
    }

    public async Task UpsertBudget(CreateBudgetDto dto, int userId)
    {
        var existing = await _context.Budgets.FirstOrDefaultAsync(b =>
            b.UserId == userId &&
            b.CategoryId == dto.CategoryId &&
            b.Month == dto.Month
        );

        if (existing != null)
        {
            existing.Amount = dto.Amount;
            existing.Currency = dto.Currency;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var budget = new Budget
            {
                UserId = userId,
                CategoryId = dto.CategoryId,
                Month = dto.Month,
                Amount = dto.Amount,
                Currency = dto.Currency,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Budgets.Add(budget);
        }

        await _context.SaveChangesAsync();
    }
    public async Task DeleteBudget(int id, int userId)
    {
        var budget = await _context.Budgets
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

        if (budget == null) throw new Exception("Not found");

        _context.Budgets.Remove(budget);
        await _context.SaveChangesAsync();
    }
}