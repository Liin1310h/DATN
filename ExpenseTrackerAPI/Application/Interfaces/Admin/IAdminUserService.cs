using ExpenseTrackerAPI.Application.DTOs;

namespace ExpenseTrackerAPI.Application.Interfaces.Admin;

public interface IAdminUserService
{
    Task<PagedResultDto<AdminUserListItemDto>> GetUsersAsync(AdminUserQueryDto query);
    Task<AdminUserDetailDto?> GetUserByIdAsync(int userId);
    Task UpdateUserStatusAsync(int userId, bool isActive, int currentAdminId);
    Task UpdateUserRoleAsync(int userId, string role);
}