namespace ExpenseTrackerAPI.Domain.Enums;

/// <summary>
/// Trạng thái khoản vay
/// </summary>
public enum LoanStatus
{
    /// <summary>
    /// Đang hoạt động
    /// </summary>
    Active = 1,
    /// <summary>
    /// Đã hoàn thành
    /// </summary>
    Completed = 2,
    /// <summary>
    /// Đã quá hạn
    /// </summary>
    Overdue = 3,
    /// <summary>
    /// Bị huỷ
    /// </summary>
    Cancelled = 4
}