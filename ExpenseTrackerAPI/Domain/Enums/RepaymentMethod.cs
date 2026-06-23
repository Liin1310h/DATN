namespace ExpenseTrackerAPI.Domain.Enums;

/// <summary>
/// Phương thức trả nợ
/// </summary>
public enum RepaymentMethod
{
    /// <summary>
    /// Không có lãi
    /// </summary>
    NoInterest = 0,
    /// <summary>
    /// Trả 1 lần cuối kỳ =gốc+ tổng lãi các tháng(=lãi*gốc*số tháng)
    /// </summary>
    SinglePayment = 1,
    /// <summary>
    /// Gốc trả đều (=tổng/số kỳ), lãi dựa trên dư nợ ban đầu (=gốc*lãi)
    /// </summary>
    FlatRateInstallment = 2,
    /// <summary>
    /// Gốc trả đều, lãi tính trên dư nợ giảm dần (=số tiền còn lại * lãi)
    /// </summary>
    EqualPrincipal = 3,
    /// <summary>
    /// Mỗi kỳ trả 1 khoản cố định
    /// </summary>
    EqualPayment = 4,
    /// <summary>
    /// Trả lãi hằng kỳ, cuối kỳ mới trả gốc
    /// </summary>
    InterestOnly = 5
}