using ExpenseTrackerAPI.Domain.Enums;

namespace ExpenseTrackerAPI.Application.DTOs;

public class LoanRequest
{
    public required string Currency = "VND";
    /// <summary>
    /// Tên người vay/cho vay
    /// </summary>
    public required string CounterPartyName { get; set; } = string.Empty;

    /// <summary>
    /// Thông tin tài chính
    /// </summary>
    public required decimal PrincipalAmount { get; set; } // Số tiền gốc
    public decimal InterestRate { get; set; } = 0; // Lãi suất

    /// <summary>
    /// Đơn vị lãi suất: "percentage_per_month", "percentage_per_year", "fixed_amount"
    /// </summary>
    public InterestUnit InterestUnit { get; set; } = InterestUnit.PercentPerYear;

    public InterestCalculationType InterestCalculationType { get; set; } = InterestCalculationType.ReducingBalance;
    /// <summary>
    /// --- Thời hạn ---
    /// </summary>
    public int Duration { get; set; }
    /// <summary>
    /// Đơn vị kỳ hạn: "days", "months", "years"
    /// </summary>
    public DurationUnit DurationUnit { get; set; } = DurationUnit.Month;

    /// <summary>
    /// --- Thời gian ---
    /// </summary>
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; } // Ngày đáo hạn dự kiến
    /// <summary>
    /// --- Logic Giao dịch đi kèm ---
    /// </summary>
    public required int AccountId { get; set; } // Tài khoản dùng để chi tiền (cho vay) hoặc nhận tiền (đi vay)
    /// <summary>
    /// Cho vay hay Đi vay
    /// </summary>
    public required bool IsLending { get; set; }
    public string? Note { get; set; }
    /// <summary>
    /// nhắc hạn vay?
    /// </summary>
    public bool IsRecurringReminder { get; set; } = false;
    public int ReminderBeforeDays { get; set; } = 0;
    public ReminderFrequency ReminderFrequency { get; set; } = ReminderFrequency.Monthly;
}