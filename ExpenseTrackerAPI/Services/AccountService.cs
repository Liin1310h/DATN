using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Services;

public class AccountService : IAccountService
{
    private readonly AppDbContext _context;
    public AccountService(AppDbContext context) => _context = context;

    public async Task<IEnumerable<Account>> GetAccountsByUserIdAsync(int userId)
    {
        return await _context.Accounts.Where(a => a.UserId == userId).ToListAsync();
    }

    public async Task<Account?> GetAccountByIdAsync(int id, int userId)
    {
        return await _context.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
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