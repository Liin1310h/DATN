namespace ExpenseTrackerAPI.Domain.Entities;

public class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;
    // loan_reminder, system, budget_warning...

    public bool IsRead { get; set; } = false;

    public string? RedirectUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}