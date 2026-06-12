using ExpenseTrackerAPI.Domain.Enums;

namespace ExpenseTrackerAPI.Application.DTOs;

public class LoanUpdateRequest
{
    public string? CounterPartyName { get; set; }   // tên người vay / cho vay
    public decimal? InterestRate { get; set; }   // lãi suất (%)
    public InterestUnit? InterestUnit { get; set; }    // "month" | "year"
    public InterestCalculationType? InterestCalculationType { get; set; } // "flat_rate" | "reducing_balance"
    public DateTime? DueDate { get; set; }
    public string? Note { get; set; }
    public bool IsRecurringReminder { get; set; } = false;
    public int ReminderBeforeDays { get; set; } = 0;
    public ReminderFrequency ReminderFrequency { get; set; } = ReminderFrequency.Monthly;
}
