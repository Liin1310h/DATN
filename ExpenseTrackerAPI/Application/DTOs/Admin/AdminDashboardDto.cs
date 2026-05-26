namespace ExpenseTrackerAPI.Application.DTOs;

/// <summary>
/// Dùng để hiển thị các số liệu tổng quan trên dashboard của admin
/// </summary>
public class AdminDashboardDto
{
    /// <summary>
    /// Theo dõi người dùng
    /// </summary>
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }
    public int NewUsersThisMonth { get; set; }

    /// <summary>
    /// Theo dõi giao dịch, ngân sách, khoản vay
    /// </summary>
    public int TotalTransactions { get; set; }
    public int TotalBudgets { get; set; }
    public int ActiveLoans { get; set; }

    /// <summary>
    /// Theo dõi danh mục
    /// </summary>
    public int SystemCategories { get; set; }
    public int UserCategories { get; set; }

    public List<MonthlyStatDto> MonthlyUsers { get; set; } = new();
    public List<MonthlyStatDto> MonthlyTransactions { get; set; } = new();

    public List<TopUserDto> TopUsers { get; set; } = new();

}

/// <summary>
/// Dùng cho thống kê theo tháng
/// </summary>
public class MonthlyStatDto
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
}

/// <summary>
/// Top user dựa trên số trans, acc, budget, loan
/// </summary>
public class TopUserDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public int TransactionCount { get; set; }
    public int AccountCount { get; set; }
    public int BudgetCount { get; set; }
    public int LoanCount { get; set; }
}