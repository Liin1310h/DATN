using ExpenseTrackerAPI.Infrastructure.Data;
using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Application.Interfaces.User;
using ExpenseTrackerAPI.Domain.Enums;
using ExpenseTrackerAPI.Application.Interfaces.Notifications;
using Microsoft.AspNetCore.Identity;
using System.Globalization;

namespace ExpenseTrackerAPI.Application.Services;

public class BudgetService : IBudgetService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IPushNotificationService _pushNotificationService;
    private readonly ICurrencyService _currencyService;
    public BudgetService(AppDbContext context, INotificationService notificationService, IPushNotificationService pushNotificationService, ICurrencyService currencyService)
    {
        _context = context;
        _notificationService = notificationService;
        _pushNotificationService = pushNotificationService;
        _currencyService = currencyService;
    }

    /// <summary>
    /// Lấy danh sách budget theo tháng của user
    /// </summary>
    /// <param name="month"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<List<BudgetResponseDto>> GetBudgets(string month, int userId)
    {
        month = NormalizeMonth(month);

        var budgets = await _context.Budgets
            .AsNoTracking()
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.Month == month)
            .ToListAsync();

        return budgets.Select(b => new BudgetResponseDto
        {
            Id = b.Id,
            CategoryId = b.CategoryId,
            CategoryName = b.Category.Name ?? "N/A",
            CategoryIcon = b.Category.Icon ?? "Tag",
            Amount = b.Amount,
            Spent = b.Spent,
            Currency = b.Currency
        }).ToList();
    }

    /// <summary>
    /// Cập nhật budget cho user theo tháng
    /// </summary>
    /// <param name="dto"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async Task UpsertBudget(CreateBudgetDto dto, int userId)
    {
        if (dto.Amount <= 0) throw new Exception("Ngân sách phải lớn hơn 0");

        var month = NormalizeMonth(dto.Month);
        var currency = NormalizeCurrency(dto.Currency);

        var categoryExists = await _context.Categories.AnyAsync(c =>
            c.Id == dto.CategoryId &&
            (c.UserId == null || c.UserId == userId));

        if (!categoryExists)
            throw new Exception("Danh mục không tồn tại hoặc không thuộc quyền sử dụng của bạn.");

        var existing = await _context.Budgets.FirstOrDefaultAsync(b =>
            b.UserId == userId &&
            b.CategoryId == dto.CategoryId &&
            b.Month == month
        );

        if (existing != null)
        {
            var currencyChanged = !string.Equals(
                existing.Currency,
                currency,
                StringComparison.OrdinalIgnoreCase);

            existing.Amount = dto.Amount;
            existing.Currency = currency;
            existing.UpdatedAt = DateTime.UtcNow;

            if (currencyChanged)
            {
                existing.Spent = await CalculateSpentAsync(userId, dto.CategoryId, month, currency);
            }

            await _context.SaveChangesAsync();

            await CheckBudgetAlertByBudgetAsync(existing.Id);
            return;
        }

        var spent = await CalculateSpentAsync(userId, dto.CategoryId, month, currency);

        var budget = new Budget
        {
            UserId = userId,
            CategoryId = dto.CategoryId,
            Month = month,
            Amount = dto.Amount,
            Spent = spent,
            Currency = currency,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Budgets.Add(budget);
        await _context.SaveChangesAsync();

        await CheckBudgetAlertByBudgetAsync(budget.Id);
    }

    /// <summary>
    /// Áp chi tiêu vào budget của user theo tháng
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="categoryId"></param>
    /// <param name="transactionDate"></param>
    /// <param name="amount"></param>
    /// <returns></returns>
    public async Task ApplyExpenseAsync(int userId, int? categoryId, DateTime transactionDate, decimal amount, string currency)
    {
        if (categoryId == null || amount <= 0) return;

        var month = GetBudgetMonth(transactionDate);
        var transactionCurrency = NormalizeCurrency(currency);

        var budget = await _context.Budgets
            .AsNoTracking()
            .Where(b => b.UserId == userId && b.Month == month && b.CategoryId == categoryId)
            .Select(b => new
            {
                b.Id,
                b.Currency
            })
            .FirstOrDefaultAsync();

        if (budget == null) return;

        var appliedAmount = await ConvertIfNeededAsync(
            amount,
            transactionCurrency,
            budget.Currency);

        await _context.Budgets
            .Where(b => b.Id == budget.Id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(b => b.Spent, b => b.Spent + appliedAmount)
                .SetProperty(b => b.UpdatedAt, DateTime.UtcNow));
    }

    /// <summary>
    /// Hoàn tác chi tiêu khỏi budget của user theo tháng (khi xoá hoặc sửa giao dịch)
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="categoryId"></param>
    /// <param name="transactionDate"></param>
    /// <param name="amount"></param>
    /// <returns></returns>
    public async Task RollbackExpenseAsync(int userId, int? categoryId, DateTime transactionDate, decimal amount, string currency)
    {
        if (categoryId == null || amount <= 0) return;

        var month = GetBudgetMonth(transactionDate);
        var transactionCurrency = NormalizeCurrency(currency);

        var budget = await _context.Budgets
            .AsNoTracking()
            .Where(b =>
                b.UserId == userId &&
                b.CategoryId == categoryId.Value &&
                b.Month == month)
            .Select(b => new
            {
                b.Id,
                b.Currency
            })
            .FirstOrDefaultAsync();

        if (budget == null) return;

        var rollbackAmount = await ConvertIfNeededAsync(
            amount,
            transactionCurrency,
            budget.Currency);

        await _context.Budgets
            .Where(b => b.Id == budget.Id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(b => b.Spent, b => b.Spent - rollbackAmount)
                .SetProperty(b => b.UpdatedAt, DateTime.UtcNow));

        await _context.Budgets
            .Where(b => b.Id == budget.Id && b.Spent < 0)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(b => b.Spent, 0m)
                .SetProperty(b => b.UpdatedAt, DateTime.UtcNow));
    }
    /// <summary>
    /// Xoá budget của user theo tháng
    /// </summary>
    /// <param name="id"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async Task DeleteBudget(int id, int userId)
    {
        var budget = await _context.Budgets
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

        if (budget == null) throw new Exception("Không tìm thấy ngân sách");

        _context.Budgets.Remove(budget);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Kiểm tra và gửi thông báo khi giao dịch chi tiêu vượt ngưỡng ngân sách đã đặt
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="categoryId"></param>
    /// <param name="transactionDate"></param>
    /// <returns></returns>
    public async Task CheckBudgetAlertAsync(int userId, int? categoryId, DateTime transactionDate)
    {
        if (categoryId == null) return;

        var month = GetBudgetMonth(transactionDate);

        var budget = await _context.Budgets
            .AsNoTracking()
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b =>
                b.UserId == userId &&
                b.CategoryId == categoryId.Value &&
                b.Month == month);

        if (budget == null) return;

        await CheckBudgetAlertCoreAsync(budget);
    }

    private async Task CheckBudgetAlertByBudgetAsync(int budgetId)
    {
        var budget = await _context.Budgets
            .AsNoTracking()
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == budgetId);

        if (budget == null)
            return;

        await CheckBudgetAlertCoreAsync(budget);
    }

    private async Task CheckBudgetAlertCoreAsync(Budget budget)
    {
        if (budget.Amount <= 0)
            return;

        var percent = budget.Spent / budget.Amount * 100;

        if (percent >= 100)
        {
            await CreateBudgetNotificationOnceAsync(
                budget.UserId,
                budget.Id,
                budget.Month,
                "budget_over",
                "Vượt ngân sách",
                $"Danh mục {budget.Category.Name} đã vượt ngân sách tháng {budget.Month}.");

            return;
        }

        if (percent >= 80)
        {
            await CreateBudgetNotificationOnceAsync(
                budget.UserId,
                budget.Id,
                budget.Month,
                "budget_warning",
                "Sắp vượt ngân sách",
                $"Danh mục {budget.Category.Name} đã dùng {percent:N0}% ngân sách tháng {budget.Month}.");
        }
    }

    private async Task CreateBudgetNotificationOnceAsync(int userId, int budgetId, string month, string type, string title, string message)
    {
        var key = $"{type}:{budgetId}:{month}";

        var existed = await _context.Notifications.AnyAsync(n =>
            n.UserId == userId &&
            n.Type == type &&
            n.ReferenceKey == key);

        if (existed) return;

        await _notificationService.CreateAsync(
            userId,
            title,
            message,
            type,
            redirectUrl: "/budget",
            referenceKey: key);

        await _pushNotificationService.SendToUserAsync(
            userId,
            title,
            message,
            "/budget");
    }

    private async Task<decimal> CalculateSpentAsync(
        int userId,
        int categoryId,
        string month,
        string budgetCurrency)
    {
        var (startUtc, endUtc) = GetUtcRangeFromBudgetMonth(month);
        var targetCurrency = NormalizeCurrency(budgetCurrency);

        var transactions = await _context.Transactions
            .AsNoTracking()
            .Where(t =>
                t.UserId == userId &&
                t.Type == TransactionType.Expense &&
                t.CategoryId == categoryId &&
                t.TransactionDate >= startUtc &&
                t.TransactionDate < endUtc)
            .Select(t => new
            {
                t.Amount,
                t.Currency
            })
            .ToListAsync();

        decimal total = 0;

        foreach (var transaction in transactions)
        {
            var transactionCurrency = NormalizeCurrency(transaction.Currency);

            total += await ConvertIfNeededAsync(
                transaction.Amount,
                transactionCurrency,
                targetCurrency);
        }

        return total;
    }

    private async Task<decimal> ConvertIfNeededAsync(
        decimal amount,
        string fromCurrency,
        string toCurrency)
    {
        var from = NormalizeCurrency(fromCurrency);
        var to = NormalizeCurrency(toCurrency);

        if (string.Equals(from, to, StringComparison.OrdinalIgnoreCase))
            return amount;

        return await _currencyService.ConvertAsync(amount, from, to);
    }

    private static string NormalizeCurrency(string? currency)
    {
        return string.IsNullOrWhiteSpace(currency)
            ? "VND"
            : currency.Trim().ToUpperInvariant();
    }

    private static string NormalizeMonth(string month)
    {
        if (string.IsNullOrWhiteSpace(month))
            throw new Exception("Tháng ngân sách không hợp lệ.");

        month = month.Trim();

        if (!DateTime.TryParseExact(
                month,
                "yyyy-MM",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out _))
        {
            throw new Exception("Tháng ngân sách phải có định dạng yyyy-MM.");
        }

        return month;
    }

    private static string GetBudgetMonth(DateTime transactionDate)
    {
        var utcDate = transactionDate.Kind switch
        {
            DateTimeKind.Utc => transactionDate,
            DateTimeKind.Local => transactionDate.ToUniversalTime(),
            _ => DateTime.SpecifyKind(transactionDate, DateTimeKind.Utc)
        };

        var localDate = TimeZoneInfo.ConvertTimeFromUtc(
            utcDate,
            GetVietnamTimeZone());

        return localDate.ToString("yyyy-MM");
    }

    private static (DateTime StartUtc, DateTime EndUtc) GetUtcRangeFromBudgetMonth(
        string month)
    {
        month = NormalizeMonth(month);

        var localStart = DateTime.ParseExact(
            $"{month}-01",
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture);

        var localEnd = localStart.AddMonths(1);
        var timeZone = GetVietnamTimeZone();

        var startUtc = TimeZoneInfo.ConvertTimeToUtc(
            DateTime.SpecifyKind(localStart, DateTimeKind.Unspecified),
            timeZone);

        var endUtc = TimeZoneInfo.ConvertTimeToUtc(
            DateTime.SpecifyKind(localEnd, DateTimeKind.Unspecified),
            timeZone);

        return (startUtc, endUtc);
    }

    private static TimeZoneInfo GetVietnamTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        }
        catch
        {
            return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        }
    }
}