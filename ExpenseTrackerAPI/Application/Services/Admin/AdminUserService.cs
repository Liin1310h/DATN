using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Application.Interfaces.Admin;
using ExpenseTrackerAPI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Application.Services.Admin;

public class AdminUserService : IAdminUserService
{
    private readonly AppDbContext _context;

    public AdminUserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AdminUserListItemDto>> GetUsersAsync(string? search)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();
            query = query.Where(x =>
                x.FullName.ToLower().Contains(keyword) ||
                x.Email.ToLower().Contains(keyword));
        }

        return await query
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new AdminUserListItemDto
            {
                Id = x.Id,
                FullName = x.FullName,
                Email = x.Email,
                Role = x.Role,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                LastLoginAt = x.LastLoginAt,

                AccountCount = _context.Accounts.Count(a => a.UserId == x.Id),
                TransactionCount = _context.Transactions.Count(t => t.UserId == x.Id),
                BudgetCount = _context.Budgets.Count(b => b.UserId == x.Id),
                LoanCount = _context.Loans.Count(l => l.UserId == x.Id),
            })
            .ToListAsync();
    }

    public async Task<AdminUserDetailDto?> GetUserByIdAsync(int userId)
    {
        return await _context.Users
            .Where(x => x.Id == userId)
            .Select(x => new AdminUserDetailDto
            {
                Id = x.Id,
                FullName = x.FullName,
                Email = x.Email,
                Role = x.Role,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                LastLoginAt = x.LastLoginAt,

                AccountCount = _context.Accounts.Count(a => a.UserId == x.Id),
                TransactionCount = _context.Transactions.Count(t => t.UserId == x.Id),
                BudgetCount = _context.Budgets.Count(b => b.UserId == x.Id),
                LoanCount = _context.Loans.Count(l => l.UserId == x.Id),
            })
            .FirstOrDefaultAsync();
    }

    public async Task UpdateUserStatusAsync(int userId, bool isActive)
    {
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user == null)
            throw new Exception("User không tồn tại.");

        user.IsActive = isActive;
        await _context.SaveChangesAsync();
    }

    public async Task UpdateUserRoleAsync(int userId, string role)
    {
        if (role != "User" && role != "Admin")
            throw new Exception("Role không hợp lệ.");

        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user == null)
            throw new Exception("User không tồn tại.");

        user.Role = role;
        await _context.SaveChangesAsync();
    }

    public async Task SoftDeleteUserAsync(int userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user == null)
            throw new Exception("User không tồn tại.");

        user.IsActive = false;
        await _context.SaveChangesAsync();
    }
}