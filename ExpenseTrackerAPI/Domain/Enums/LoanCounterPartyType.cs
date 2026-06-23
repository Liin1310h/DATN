namespace ExpenseTrackerAPI.Domain.Enums;

/// <summary>
/// Loại đối tượng vay
/// </summary>
public enum LoanCounterPartyType
{
    /// <summary>
    /// Cá nhân
    /// </summary>
    Personal = 1,
    /// <summary>
    /// Ngân hàng
    /// </summary>
    Bank = 2,
    /// <summary>
    /// Cửa hàng
    /// </summary>
    Merchant = 3,
    /// <summary>
    /// Khác
    /// </summary>
    Other = 4
}