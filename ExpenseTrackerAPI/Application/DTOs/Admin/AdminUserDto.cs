namespace ExpenseTrackerAPI.Application.DTOs;

/// !Lấy danh sách người dùng
/// <summary>
/// Dto để lấy danh sách user
/// </summary>
public class AdminUserQueryDto
{
    /// <summary>
    /// Từ khoá tìm kiếm
    /// </summary>
    public string? Search { get; set; }
    /// <summary>
    /// Role: Admin, User, all
    /// </summary>
    public string? Role { get; set; }
    /// <summary>
    /// Active?
    /// </summary>
    public bool? IsActive { get; set; }
    /// <summary>
    /// Sx dựa trên: createdAt, lastLoginAt, transactionCount, accountCount, loanCount
    /// </summary>
    public string SortBy { get; set; } = "createdAt";
    /// <summary>
    /// Tăng/ giảm
    /// </summary>
    public string SortDirection { get; set; } = "desc";
    /// <summary>
    /// Trang hiện tại
    /// </summary>
    public int Page { get; set; } = 1;
    /// <summary>
    /// Kích thước trang
    /// </summary>
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// DTO return cho frontend
/// </summary>
/// <typeparam name="T"></typeparam>
public class PagedResultDto<T>
{
    /// <summary>
    /// Danh sách các user
    /// </summary>
    public List<T> Items { get; set; } = new();
    /// <summary>
    /// Tổng cộng
    /// </summary>
    public int TotalCount { get; set; }
    /// <summary>
    /// Trang hiện tại
    /// </summary>
    public int Page { get; set; }
    /// <summary>
    /// Kích thước trang
    /// </summary>
    public int PageSize { get; set; }
    /// <summary>
    /// Tổng số trang
    /// </summary>
    public int TotalPages { get; set; }
}

/// <summary>
/// Danh sách các người dùng
/// </summary>
public class AdminUserListItemDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = "User";
    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public int AccountCount { get; set; }
    public int TransactionCount { get; set; }
    public int BudgetCount { get; set; }
    public int LoanCount { get; set; }
}



///! <summary>
///! Chi tiết 1 user
/// </summary>
public class AdminUserDetailDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = "User";
    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public int AccountCount { get; set; }
    public int TransactionCount { get; set; }
    public int BudgetCount { get; set; }
    public int LoanCount { get; set; }
    public DateTime? LastTransactionDate { get; set; }
    public int ActiveLoanCount { get; set; }
}

public class AdminUpdateUserStatusRequest
{
    public bool IsActive { get; set; }
}

public class AdminUpdateUserRoleRequest
{
    public string Role { get; set; } = "User";
}