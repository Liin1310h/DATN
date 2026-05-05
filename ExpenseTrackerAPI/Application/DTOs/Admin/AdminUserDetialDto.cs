namespace ExpenseTrackerAPI.Application.DTOs;

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
}