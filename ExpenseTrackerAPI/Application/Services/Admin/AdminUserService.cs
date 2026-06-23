using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Application.Interfaces.Admin;
using ExpenseTrackerAPI.Application.Interfaces.Notifications;
using ExpenseTrackerAPI.Domain.Enums;
using ExpenseTrackerAPI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Application.Services.Admin;

public class AdminUserService : IAdminUserService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IPushNotificationService _pushNotificationService;
    public AdminUserService(AppDbContext context, INotificationService notificationService, IPushNotificationService pushNotificationService)
    {
        _context = context;
        _notificationService = notificationService;
        _pushNotificationService = pushNotificationService;
    }

    /// <summary>
    /// Lấy danh sách người dùng với lọc và sắp xếp, phân trang
    /// </summary>
    /// <param name="query"></param>
    /// <returns></returns>
    public async Task<PagedResultDto<AdminUserListItemDto>> GetUsersAsync(AdminUserQueryDto query)
    {
        var page = query.Page <= 0 ? 1 : query.Page;
        var pageSize = query.PageSize <= 0 ? 20 : query.PageSize;
        pageSize = Math.Min(pageSize, 100);

        var usersQuery = _context.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var keyword = query.Search.Trim().ToLower();

            usersQuery = usersQuery.Where(x =>
                x.FullName.ToLower().Contains(keyword) ||
                x.Email.ToLower().Contains(keyword));
        }

        if (!string.IsNullOrWhiteSpace(query.Role) && query.Role != "all")
        {
            usersQuery = usersQuery.Where(x => x.Role == query.Role);
        }

        if (query.IsActive.HasValue)
        {
            usersQuery = usersQuery.Where(x => x.IsActive == query.IsActive.Value);
        }

        var projectedQuery = usersQuery.Select(x => new AdminUserListItemDto
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
        });

        projectedQuery = ApplySorting(
            projectedQuery,
            query.SortBy,
            query.SortDirection
        );

        var totalCount = await projectedQuery.CountAsync();

        var items = await projectedQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResultDto<AdminUserListItemDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    /// <summary>
    /// Chi tiết 1 user
    /// </summary>
    /// <param name="userId">id</param>
    /// <returns></returns>
    public async Task<AdminUserDetailDto?> GetUserByIdAsync(int userId)
    {
        var user = await _context.Users
            .AsNoTracking()
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
                LastTransactionDate = _context.Transactions
                .Where(t => t.UserId == x.Id)
                .OrderByDescending(t => t.TransactionDate)
                .Select(t => (DateTime?)t.TransactionDate)
                .FirstOrDefault(),

                ActiveLoanCount = _context.Loans
                .Count(l => l.UserId == x.Id && l.Status == LoanStatus.Active)
            })
            .FirstOrDefaultAsync();

        if (user == null)
            return null;

        return user;
    }

    /// <summary>
    /// Update trạng thái của 1 người dùng (active hoặc inactive)
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="isActive"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async Task UpdateUserStatusAsync(int userId, bool isActive, int currentAdminId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);

        if (user == null)
            throw new Exception("User không tồn tại.");

        // Không cho admin khoá chính mình
        if (user.Id == currentAdminId && !isActive)
            throw new Exception("Admin không tự khoá tài khoản của mình.");

        // Không cho khóa admin cuối cùng
        if (user.Role == "Admin" && !isActive)
        {
            var otherActiveAdminCount = await _context.Users.CountAsync(x =>
                x.Role == "Admin" &&
                x.IsActive &&
                x.Id != userId
            );

            if (otherActiveAdminCount == 0)
                throw new Exception("Không thể khóa admin cuối cùng của hệ thống.");
        }

        var oldStatus = user.IsActive;

        // Nếu trạng thái không thay đổi thì không cần tạo thông báo
        if (oldStatus == isActive)
            return;

        user.IsActive = isActive;
        await _context.SaveChangesAsync();

        if (!isActive)
        {
            var title = "Tài khoản đã bị khóa";
            var message = "Tài khoản của bạn đã bị quản trị viên khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.";

            await _notificationService.CreateAsync(
                userId: user.Id,
                title: title,
                message: message,
                type: "ACCOUNT_LOCKED",
                redirectUrl: "/login",
                referenceKey: $"account_locked_{user.Id}_{DateTime.UtcNow:yyyyMMddHHmmss}"
            );

            await _pushNotificationService.SendToUserAsync(
                userId: user.Id,
                title: title,
                message: message,
                url: "/login"
            );
        }
        else
        {
            var title = "Tài khoản đã được mở khóa";
            var message = "Tài khoản của bạn đã được quản trị viên mở khóa. Bạn có thể đăng nhập và tiếp tục sử dụng hệ thống.";

            await _notificationService.CreateAsync(
                userId: user.Id,
                title: title,
                message: message,
                type: "ACCOUNT_UNLOCKED",
                redirectUrl: "/login",
                referenceKey: $"account_unlocked_{user.Id}_{DateTime.UtcNow:yyyyMMddHHmmss}"
            );

            await _pushNotificationService.SendToUserAsync(
                userId: user.Id,
                title: title,
                message: message,
                url: "/login"
            );
        }
    }

    /// <summary>
    /// Update role (user<=>admin)
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="role"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
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

    /// <summary>
    /// Phần sắp xếp
    /// </summary>
    /// <param name="query"></param>
    /// <param name="sortBy"></param>
    /// <param name="sortDirection"></param>
    /// <returns></returns>
    private static IQueryable<AdminUserListItemDto> ApplySorting(
        IQueryable<AdminUserListItemDto> query,
        string? sortBy,
        string? sortDirection
    )
    {
        var isAsc = sortDirection?.ToLower() == "asc";

        return sortBy switch
        {
            "fullName" => isAsc
                ? query.OrderBy(x => x.FullName)
                : query.OrderByDescending(x => x.FullName),

            "email" => isAsc
                ? query.OrderBy(x => x.Email)
                : query.OrderByDescending(x => x.Email),

            "lastLoginAt" => isAsc
                ? query.OrderBy(x => x.LastLoginAt)
                : query.OrderByDescending(x => x.LastLoginAt),

            "transactionCount" => isAsc
                ? query.OrderBy(x => x.TransactionCount)
                : query.OrderByDescending(x => x.TransactionCount),

            "accountCount" => isAsc
                ? query.OrderBy(x => x.AccountCount)
                : query.OrderByDescending(x => x.AccountCount),

            "loanCount" => isAsc
                ? query.OrderBy(x => x.LoanCount)
                : query.OrderByDescending(x => x.LoanCount),

            _ => isAsc
                ? query.OrderBy(x => x.CreatedAt)
                : query.OrderByDescending(x => x.CreatedAt)
        };
    }
}