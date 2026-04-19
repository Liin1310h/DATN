namespace ExpenseTrackerAPI.Application.DTOs;

public class LoanUpdateRequest
{
    public string? CounterPartyName { get; set; }   // tên người vay / cho vay
    public decimal? InterestRate { get; set; }   // lãi suất (%)
    public string? InterestUnit { get; set; }    // "month" | "year"
    public DateTime? DueDate { get; set; }
    public string? Note { get; set; }
}
