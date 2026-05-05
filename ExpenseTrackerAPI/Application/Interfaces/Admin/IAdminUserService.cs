using ExpenseTrackerAPI.Application.DTOs;

namespace ExpenseTrackerAPI.Application.Interfaces.Admin;

public interface IAdminUserService
{
    Task<IEnumerable<AdminUserListItemDto>> GetUsersAsync(string? search);
    Task<AdminUserDetailDto?> GetUserByIdAsync(int userId);
    Task UpdateUserStatusAsync(int userId, bool isActive);
    Task UpdateUserRoleAsync(int userId, string role);
    Task SoftDeleteUserAsync(int userId);
}