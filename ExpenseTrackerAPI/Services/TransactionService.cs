using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using ExpenseTrackerAPI.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ExpenseTrackerAPI.Services;

public class TransactionService : ITransactionService
{
    private readonly AppDbContext _context;
    public TransactionService(AppDbContext context) => _context = context;

    private bool IsOut(string type) => type is "expense" or "lend" or "transfer";
    private bool IsIn(string type) => type is "income" or "borrow";

    public async Task<Transaction> CreateTransactionAsync(TransactionRequest request, int userId)
    {
        using var dbTrans = await _context.Database.BeginTransactionAsync();
        try
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == request.AccountId && a.UserId == userId);
            if (account == null) throw new Exception("Tài khoản không tồn tại.");

            decimal applyAmount = request.ConvertedAmount ?? request.Amount;
            decimal balanceBefore = account.Balance;

            if (IsOut(request.Type))
            {
                if (account.Balance < applyAmount) throw new Exception("Số dư không đủ.");
                account.Balance -= applyAmount;
            }
            else
            {
                account.Balance += applyAmount;
            }

            var transaction = new Transaction
            {
                Currency = request.Currency,
                Amount = request.Amount,
                ConvertedAmount = request.ConvertedAmount,
                BalanceBefore = balanceBefore,
                BalanceAfter = account.Balance,
                Type = request.Type.ToLower(),
                Note = request.Note ?? "",
                TransactionDate = DateTime.UtcNow,
                UserId = userId,
                FromAccountId = IsOut(request.Type) ? request.AccountId : null,
                ToAccountId = IsIn(request.Type) ? request.AccountId : null,
                CategoryId = request.CategoryId,
                LoanId = request.LoanId
            };

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();
            await dbTrans.CommitAsync();
            return transaction;
        }
        catch { await dbTrans.RollbackAsync(); throw; }
    }

    public async Task<Transaction> UpdateTransactionAsync(int id, TransactionRequest request, int userId)
    {
        using var dbTrans = await _context.Database.BeginTransactionAsync();
        try
        {
            var transaction = await _context.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (transaction == null) throw new Exception("Giao dịch không tồn tại.");

            var oldAccountId = transaction.FromAccountId ?? transaction.ToAccountId;
            var oldAccount = await _context.Accounts.FirstAsync(a => a.Id == oldAccountId);

            // 1. Rollback số dư cũ
            decimal oldAmount = transaction.ConvertedAmount ?? transaction.Amount;
            if (IsOut(transaction.Type)) oldAccount.Balance += oldAmount;
            else oldAccount.Balance -= oldAmount;

            // 2. Áp dụng số dư mới
            var newAccount = (oldAccountId == request.AccountId) ? oldAccount : await _context.Accounts.FirstAsync(a => a.Id == request.AccountId);
            decimal newAmount = request.ConvertedAmount ?? request.Amount;

            decimal balanceBefore = newAccount.Balance;
            if (IsOut(request.Type))
            {
                if (newAccount.Balance < newAmount) throw new Exception("Số dư tài khoản mới không đủ.");
                newAccount.Balance -= newAmount;
            }
            else newAccount.Balance += newAmount;

            // 3. Cập nhật Transaction object
            transaction.Amount = request.Amount;
            transaction.ConvertedAmount = request.ConvertedAmount;
            transaction.Currency = request.Currency;
            transaction.Type = request.Type.ToLower();
            transaction.BalanceBefore = balanceBefore;
            transaction.BalanceAfter = newAccount.Balance;
            transaction.CategoryId = request.CategoryId;
            transaction.FromAccountId = IsOut(request.Type) ? request.AccountId : null;
            transaction.ToAccountId = IsIn(request.Type) ? request.AccountId : null;
            transaction.Note = request.Note ?? string.Empty;
            transaction.TransactionDate = request.TransactionDate ?? DateTime.Now;
            await _context.SaveChangesAsync();
            await dbTrans.CommitAsync();
            return transaction;
        }
        catch { await dbTrans.RollbackAsync(); throw; }
    }

    public async Task DeleteTransactionAsync(int id, int userId)
    {
        using var dbTrans = await _context.Database.BeginTransactionAsync();
        try
        {
            var transaction = await _context.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (transaction == null) throw new Exception("Không thấy giao dịch.");

            var accountId = transaction.FromAccountId ?? transaction.ToAccountId;
            var account = await _context.Accounts.FirstAsync(a => a.Id == accountId);

            decimal amount = transaction.ConvertedAmount ?? transaction.Amount;
            if (IsOut(transaction.Type)) account.Balance += amount;
            else account.Balance -= amount;

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();
            await dbTrans.CommitAsync();
        }
        catch { await dbTrans.RollbackAsync(); throw; }
    }

    public async Task<Transaction> TransferAsync(TransferRequest request, int userId)
    {
        using var dbTrans = await _context.Database.BeginTransactionAsync();
        try
        {
            var fromAcc = await _context.Accounts.FirstAsync(a => a.Id == request.FromAccountId && a.UserId == userId);
            var toAcc = await _context.Accounts.FirstAsync(a => a.Id == request.ToAccountId && a.UserId == userId);

            if (fromAcc.Balance < request.Amount) throw new Exception("Số dư không đủ chuyển.");

            decimal balanceBefore = fromAcc.Balance;
            fromAcc.Balance -= request.Amount;
            toAcc.Balance += request.ConvertedAmount;

            var trans = new Transaction
            {
                Amount = request.Amount,
                ConvertedAmount = request.ConvertedAmount,
                Type = "transfer",
                UserId = userId,
                Currency = fromAcc.Currency,
                FromAccountId = fromAcc.Id,
                ToAccountId = toAcc.Id,
                TransactionDate = DateTime.UtcNow,
                BalanceBefore = balanceBefore,
                BalanceAfter = fromAcc.Balance,
                Note = request.Note ?? ""
            };

            _context.Transactions.Add(trans);
            await _context.SaveChangesAsync();
            await dbTrans.CommitAsync();
            return trans;
        }
        catch { await dbTrans.RollbackAsync(); throw; }
    }

    public async Task<Transaction?> GetTransactionByIdAsync(int id, int userId) =>
        await _context.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

    public async Task<PagedResult<TransactionResponse>> GetHistoryAsync(int userId, int? accountId, string? type, int? categoryId, DateTime? fromDate, DateTime? toDate, string? searchQuery, bool? isIn, int page, int pageSize)
    {
        var query = _context.Transactions
        .Include(t => t.Category)
        .Include(t => t.FromAccount)
        .Include(t => t.ToAccount)
        .Where(t => t.UserId == userId);

        // Filter
        if (accountId.HasValue) query = query.Where(t => t.FromAccountId == accountId || t.ToAccountId == accountId);
        if (categoryId.HasValue && categoryId > 0) query = query.Where(t => t.CategoryId == categoryId);

        // Xử lý query theo giờ
        var vnZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        if (fromDate.HasValue)
        {
            var fromLocal = DateTime.SpecifyKind(fromDate.Value, DateTimeKind.Unspecified);
            fromDate = TimeZoneInfo.ConvertTimeToUtc(fromLocal, vnZone); //Chuyển sang giờ UTC
            query = query.Where(t => t.TransactionDate >= fromDate);
        }
        if (toDate.HasValue)
        {
            var toLocal = DateTime.SpecifyKind(toDate.Value.AddDays(1), DateTimeKind.Unspecified);
            toDate = TimeZoneInfo.ConvertTimeToUtc(toLocal, vnZone);
            query = query.Where(t => t.TransactionDate < toDate);
        }

        if (!string.IsNullOrEmpty(type) && type.ToLower() != "all") query = query.Where(t => t.Type == type.ToLower());
        if (!string.IsNullOrEmpty(searchQuery)) query = query.Where(t => t.Note.Contains(searchQuery));

        // Lấy tổng số lượng trước khi phân trang
        var totalCount = await query.CountAsync();

        var items = await query.OrderByDescending(t => t.TransactionDate)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(t => new TransactionResponse
            {
                Id = t.Id,
                Amount = t.Amount,
                Currency = t.Currency,
                Type = t.Type,
                TransactionDate = t.TransactionDate,
                Note = t.Note,

                CategoryId = t.CategoryId,
                CategoryName = t.Category != null ? t.Category.Name : "Chưa phân loại",
                CategoryIcon = t.Category != null ? t.Category.Icon : "Tag",
                CategoryColor = t.Category != null ? t.Category.Color : "#cbd5e1",
                FromAccountId = t.FromAccountId,
                ToAccountId = t.ToAccountId,
                AccountName = t.FromAccount != null ? t.FromAccount.Name :
                     (t.ToAccount != null ? t.ToAccount.Name : "Tiền mặt")
            }).ToListAsync();

        return new PagedResult<TransactionResponse>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }
    public async Task<TransactionChartDto> GetChartAsync(int userId, string range)
    {
        var now = DateTime.UtcNow;

        DateTime fromDate = range switch
        {
            "day" => now.Date,
            "week" => now.Date.AddDays(-6),
            "month" => now.Date.AddDays(-30),
            _ => now.Date.AddDays(-6)
        };

        // Lấy tiền tệ mặc định
        var user = await _context.UserSettings.FindAsync(userId);
        var baseCurrency = user?.DefaultCurrency ?? "VND";

        var data = await _context.Transactions
            .Where(t => t.UserId == userId && t.TransactionDate >= fromDate && t.ConvertedAmount.HasValue)
            .Select(t => new
            {
                Date = t.TransactionDate.Date,
                t.Type,
                t.Currency,
                t.Amount,
                t.ConvertedAmount
            })
            .ToListAsync();

        var grouped = data
            .GroupBy(x => x.Date)
            .OrderBy(g => g.Key)
            .ToList();

        var result = new TransactionChartDto();

        foreach (var g in grouped)
        {
            result.Labels.Add(g.Key.ToString("yyyy-MM-dd"));

            // Tính expense
            decimal dailyExpense = 0;
            foreach (var item in g.Where(x => x.Type == "expense"))
            {
                dailyExpense += (item.Currency == baseCurrency) ? item.Amount : (item.ConvertedAmount ?? item.Amount);
            }
            result.Expenses.Add(dailyExpense);

            // Tính income
            decimal dailyIncome = 0;
            foreach (var item in g.Where(x => x.Type == "income"))
            {
                dailyIncome += (item.Currency == baseCurrency) ? item.Amount : (item.ConvertedAmount ?? item.Amount);
            }
            result.Incomes.Add(dailyIncome);
        }

        return result;
    }

    public async Task<CategoryChartDto> GetCategoryChartAsync(int userId, string range)
    {
        var now = DateTime.UtcNow;

        DateTime fromDate = range switch
        {
            "day" => now.Date,
            "week" => now.Date.AddDays(-6),
            "month" => now.Date.AddDays(-30),
            _ => now.Date.AddDays(-6)
        };

        // lấy tiền tệ mặc định
        var user = await _context.UserSettings.FindAsync(userId);
        var baseCurrency = user?.DefaultCurrency ?? "VND";

        var data = await _context.Transactions
            .Where(t => t.UserId == userId
                     && t.TransactionDate >= fromDate
                     && t.ConvertedAmount.HasValue
                     && t.Type == "expense")
            .Include(t => t.Category)
            .Select(t => new
            {
                CategoryName = t.Category != null ? t.Category.Name : "Khác",
                t.Currency,
                t.Amount,
                t.ConvertedAmount
            })
            .ToListAsync();

        var grouped = data
            .GroupBy(x => x.CategoryName)
            .Select(g => new
            {
                Category = g.Key,
                TotalAmount = g.Sum(x => (x.Currency == baseCurrency) ? x.Amount : (x.ConvertedAmount ?? x.Amount))
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToList();

        var result = new CategoryChartDto();

        foreach (var item in grouped)
        {
            result.Labels.Add(item.Category);
            result.Values.Add(item.TotalAmount);
        }

        return result;
    }
}