using ExpenseTrackerAPI.Infrastructure.Data;
using ExpenseTrackerAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Application.Interfaces.User;
using ExpenseTrackerAPI.Application.DTOs;

namespace ExpenseTrackerAPI.Application.Services;

public class AccountService : IAccountService
{
    private readonly AppDbContext _context;
    public AccountService(AppDbContext context) => _context = context;

    public async Task<IEnumerable<Account>> GetAccountsByUserIdAsync(int userId)
    {
        return await _context.Accounts.Where(a => a.UserId == userId).ToListAsync();
    }

    public async Task<AccountDetailDto?> GetAccountByIdAsync(int id, int userId)
    {
        var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (account == null) return null;

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startOfNextMonth = startOfMonth.AddMonths(1);

        var transactions = await _context.Transactions
        .Include(t => t.Category)
        .Where(t =>
            t.UserId == userId &&
            (t.FromAccountId == id || t.ToAccountId == id) &&
            t.TransactionDate >= startOfMonth &&
            t.TransactionDate < startOfNextMonth)
        .OrderByDescending(t => t.TransactionDate)
        .ToListAsync();

        var totalIn = transactions
            .Where(t => t.ToAccountId == id)
            .Sum(t => t.ConvertedAmount ?? t.Amount);

        var totalOut = transactions
            .Where(t => t.FromAccountId == id)
            .Sum(t => t.ConvertedAmount ?? t.Amount);

        return new AccountDetailDto
        {
            Id = account.Id,
            Name = account.Name,
            Type = account.Type,
            Currency = account.Currency,
            Balance = account.Balance,
            Logo = account.Logo,

            TransactionCountThisMonth = transactions.Count,
            TotalInThisMonth = totalIn,
            TotalOutThisMonth = totalOut,

            TransactionsThisMonth = transactions.Select(t => new AccountTransactionDto
            {
                Id = t.Id,
                Amount = t.ConvertedAmount ?? t.Amount,
                Currency = account.Currency,
                Type = (int)t.Type,
                Note = t.Note,
                TransactionDate = t.TransactionDate,
                CategoryName = t.Category != null ? t.Category.Name : null
            }).ToList()
        };
    }

    public async Task<Account> CreateAccountAsync(Account account, int userId)
    {
        account.UserId = userId;
        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();
        return account;
    }

    public async Task UpdateAccountAsync(int id, Account account, int userId)
    {
        var existing = await _context.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (existing == null) throw new Exception("Không tìm thấy tài khoản hoặc bạn không có quyền.");

        account.UserId = userId;
        _context.Entry(account).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAccountAsync(int id, int userId)
    {
        var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (account == null) throw new Exception("Tài khoản không tồn tại.");

        _context.Accounts.Remove(account);
        await _context.SaveChangesAsync();
    }
}