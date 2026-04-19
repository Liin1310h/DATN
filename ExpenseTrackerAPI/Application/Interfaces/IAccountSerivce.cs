using ExpenseTrackerAPI.Domain.Entities;

namespace ExpenseTrackerAPI.Application.Interfaces;

public interface IAccountService
{
    Task<IEnumerable<Account>> GetAccountsByUserIdAsync(int userId);
    Task<Account?> GetAccountByIdAsync(int id, int userId);
    Task<Account> CreateAccountAsync(Account account, int userId);
    Task UpdateAccountAsync(int id, Account account, int userId);
    Task DeleteAccountAsync(int id, int userId);
}