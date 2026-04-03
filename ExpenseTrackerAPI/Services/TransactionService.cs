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
            transaction.FromAccountId = IsOut(request.Type) ? request.AccountId : null;
            transaction.ToAccountId = IsIn(request.Type) ? request.AccountId : null;
            transaction.Note = request.Note;

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
        if (fromDate.HasValue) query = query.Where(t => t.TransactionDate >= fromDate);
        if (toDate.HasValue) query = query.Where(t => t.TransactionDate <= toDate);
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
                CategoryName = t.Category != null ? t.Category.Name : "Chưa phân loại",
                CategoryIcon = t.Category != null ? t.Category.Icon : "Tag",
                CategoryColor = t.Category != null ? t.Category.Color : "#cbd5e1",
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
}