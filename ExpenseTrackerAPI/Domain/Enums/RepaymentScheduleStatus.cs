namespace ExpenseTrackerAPI.Domain.Enums;

/// <summary>
/// Trạng thái của một kỳ trả nợ.
/// </summary>
public enum RepaymentScheduleStatus
{
    /// <summary>
    /// Chưa thanh toán.
    /// </summary>
    Pending = 1,

    /// <summary>
    /// Đã thanh toán một phần.
    /// </summary>
    PartiallyPaid = 2,

    /// <summary>
    /// Đã thanh toán đủ.
    /// </summary>
    Paid = 3,

    /// <summary>
    /// Đã quá hạn.
    /// </summary>
    Overdue = 4,

    /// <summary>
    /// Đã huỷ.
    /// </summary>
    Cancelled = 5
}