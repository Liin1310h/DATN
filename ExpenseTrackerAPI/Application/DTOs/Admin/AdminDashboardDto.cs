namespace ExpenseTrackerAPI.Application.DTOs;

public class AdminDashboardDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int NewUsersThisMonth { get; set; }

    public int TotalTransactions { get; set; }
    public int TotalBudgets { get; set; }
    public int ActiveLoans { get; set; }

    public int SystemCategories { get; set; }
    public int UserCategories { get; set; }
}