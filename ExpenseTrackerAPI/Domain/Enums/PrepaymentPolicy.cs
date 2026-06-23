namespace ExpenseTrackerAPI.Domain.Enums;

/// <summary>
/// Chính sách trả nợ
/// </summary>
public enum PrepaymentPolicy
{
    /// <summary>
    /// Không cho phép trả trước, chỉ được trả đúng tiền
    /// </summary>
    NotAllowed = 0,
    /// <summary>
    /// Cho phép trả trước nhưng không tính lại lãi và kế hoạch trả nợ
    /// </summary>
    AllowWithoutRecalculation = 1,
    /// <summary>
    /// Cho phép trả trước + tính lại kế hoạch trả
    /// </summary>
    AllowAndRecalculateSchedule = 2
}
