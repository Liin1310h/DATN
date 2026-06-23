using ExpenseTrackerAPI.Domain.Enums;

namespace ExpenseTrackerAPI.Application.DTOs;

public class LoanUpdateRequest
{
    /// <summary>
    /// Loại đối tượng
    /// Chỉ được sửa khi chưa phát sinh thanh toán.
    /// </summary>
    public LoanCounterPartyType? CounterPartyType { get; set; }

    /// <summary>
    /// Tên đối tác vay/cho vay.
    /// Có thể sửa bất cứ lúc nào.
    /// </summary>
    public string? CounterPartyName { get; set; }

    /// <summary>
    /// Lãi suất theo đơn vị InterestUnit.
    /// Chỉ được sửa khi chưa phát sinh thanh toán.
    /// </summary>
    public decimal? InterestRate { get; set; }

    /// <summary>
    /// Đơn vị lãi suất.
    /// Chỉ được sửa khi chưa phát sinh thanh toán.
    /// </summary>
    public InterestUnit? InterestUnit { get; set; }

    /// <summary>
    /// Số kỳ hạn vay.
    /// Chỉ được sửa khi chưa phát sinh thanh toán.
    /// </summary>
    public int? Duration { get; set; }

    /// <summary>
    /// Đơn vị kỳ hạn vay.
    /// Chỉ được sửa khi chưa phát sinh thanh toán.
    /// </summary>
    public DurationUnit? DurationUnit { get; set; }

    /// <summary>
    /// Ngày bắt đầu vay.
    /// Chỉ được sửa khi chưa phát sinh thanh toán.
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// Phương thức trả nợ.
    /// Chỉ được sửa khi chưa phát sinh thanh toán.
    /// </summary>
    public RepaymentMethod? RepaymentMethod { get; set; }

    /// <summary>
    /// Chính sách trả trước hạn.
    /// Chỉ được sửa khi chưa phát sinh thanh toán.
    /// </summary>
    public PrepaymentPolicy? PrepaymentPolicy { get; set; }

    /// <summary>
    /// Thứ tự ưu tiên phân bổ thanh toán.
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
    /// Chỉ được sửa khi chưa phát sinh thanh toán.
    /// </summary>
    public int? PaymentDayOfMonth { get; set; }

    /// <summary>
    /// Nếu true, lãi được tính theo số ngày thực tế giữa các kỳ.
    /// Chỉ được sửa khi chưa phát sinh thanh toán.
    /// </summary>
    public bool? IsInterestAccruedDaily { get; set; }

    /// <summary>
    /// Ghi chú.
    /// Có thể sửa bất cứ lúc nào.
    /// </summary>
    public string? Note { get; set; }

    /// <summary>
    /// Có nhắc hạn khoản vay hay không.
    /// </summary>
    public bool? IsRecurringReminder { get; set; }

    /// <summary>
    /// Nhắc trước ngày đến hạn bao nhiêu ngày.
    /// </summary>
    public int? ReminderBeforeDays { get; set; }

    /// <summary>
    /// Tần suất nhắc lại.
    /// </summary>
    public ReminderFrequency? ReminderFrequency { get; set; }
}