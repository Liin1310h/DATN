using ExpenseTrackerAPI.Domain.Enums;

namespace ExpenseTrackerAPI.Application.DTOs;

public class LoanRequest
{
    public required string Currency = "VND";
    /// <summary>
    /// Loại đối tượng vay
    /// </summary>
    public LoanCounterPartyType CounterPartyType { get; set; } = LoanCounterPartyType.Personal;
    /// <summary>
    /// Tên người vay/cho vay
    /// </summary>
    public required string CounterPartyName { get; set; } = string.Empty;

    /// <summary>
    /// Số tiền gốc
    /// </summary>
    public required decimal PrincipalAmount { get; set; }
    /// <summary>
    /// Lãi suất
    /// </summary>
    public decimal InterestRate { get; set; } = 0;

    /// <summary>
    /// Đơn vị lãi suất: "percentage_per_month", "percentage_per_year", "fixed_amount"
    /// </summary>
    public InterestUnit InterestUnit { get; set; } = InterestUnit.PercentPerYear;

    /// <summary>
    /// Thời hạn
    /// </summary>
    public int Duration { get; set; }
    /// <summary>
    /// Đơn vị kỳ hạn: "days", "months", "years"
    /// </summary>
    public DurationUnit DurationUnit { get; set; } = DurationUnit.Month;

    /// <summary>
    /// Thời gian
    /// </summary>
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    /// <summary>
    /// Tài khoản dùng để chi tiền (cho vay) hoặc nhận tiền (đi vay)
    /// </summary>
    public required int AccountId { get; set; }
    /// <summary>
    /// Cho vay hay Đi vay
    /// </summary>
    public required bool IsLending { get; set; }
    /// <summary>
    /// Ghi chú
    /// </summary>
    public string? Note { get; set; }
    /// <summary>
    /// Phương thức trả nợ.
    /// </summary>
    public RepaymentMethod RepaymentMethod { get; set; } = RepaymentMethod.NoInterest;

    /// <summary>
    /// Chính sách trả trước hạn.
    /// </summary>
    public PrepaymentPolicy PrepaymentPolicy { get; set; } = PrepaymentPolicy.NotAllowed;

    /// <summary>
    /// Thứ tự ưu tiên phân bổ tiền thanh toán.
    /// Nếu null, service sẽ tự chọn theo CounterPartyType.
    /// </summary>
    public PaymentAllocationStrategy? AllocationStrategy { get; set; }

    /// <summary>
    /// Tỷ lệ phí/phạt trả chậm.
    /// </summary>
    public decimal? LateFeeRate { get; set; }

    /// <summary>
    /// Tỷ lệ phí trả trước hạn.
    /// </summary>
    public decimal? PrepaymentFeeRate { get; set; }

    /// <summary>
    /// Ngày trả nợ trong tháng.
    /// </summary>
    public int? PaymentDayOfMonth { get; set; }

    /// <summary>
    /// Nếu true, lãi được tính theo số ngày thực tế giữa các kỳ.
    /// </summary>
    public bool IsInterestAccruedDaily { get; set; } = false;

    /// <summary>
    /// nhắc hạn vay?
    /// </summary>
    public bool IsRecurringReminder { get; set; } = false;
    /// <summary>
    /// Nhắc hạn trước bao nhiêu thời gian
    /// </summary>
    public int ReminderBeforeDays { get; set; } = 0;
    /// <summary>
    /// Đơn vị thời gian nhắc hạn
    /// </summary>
    public ReminderFrequency ReminderFrequency { get; set; } = ReminderFrequency.Monthly;
}