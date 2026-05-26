namespace ExpenseTrackerAPI.Application.DTOs;

public class AdminUserQueryDto
{
    public string? Search { get; set; }
    public string? Role { get; set; } // "Admin", "User", "all"
    public bool? IsActive { get; set; }

    public string SortBy { get; set; } = "createdAt";
    // createdAt, lastLoginAt, transactionCount, accountCount, loanCount

    public string SortDirection { get; set; } = "desc";
    // asc, desc

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PagedResultDto<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

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

public class AdminUserAccountSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Currency { get; set; } = "VND";
    public decimal Balance { get; set; }
}

public class AdminUserRecentTransactionDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public string? Note { get; set; }
    public DateTime TransactionDate { get; set; }
    public string? CategoryName { get; set; }
    public string? FromAccountName { get; set; }
    public string? ToAccountName { get; set; }
    public string? AccountName { get; set; }
}

public class AdminUserLoanSummaryDto
{
    public int Id { get; set; }
    public string CounterPartyName { get; set; } = string.Empty;
    public decimal PrincipalAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public string Currency { get; set; } = "VND";
    public bool IsLending { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? DueDate { get; set; }
}