namespace ExpenseTrackerAPI.Application.DTOs;

public class LoanUpdateRequest
{
    public string? CounterPartyName { get; set; }   // tên người vay / cho vay
    public decimal? InterestRate { get; set; }   // lãi suất (%)
    public string? InterestUnit { get; set; }    // "month" | "year"
    public DateTime? DueDate { get; set; }
    public string? Note { get; set; }
    public bool IsRecurringReminder { get; set; } = false;
    public int ReminderBeforeDays { get; set; } = 0;
    public string ReminderFrequency { get; set; } = "Monthly";
}
