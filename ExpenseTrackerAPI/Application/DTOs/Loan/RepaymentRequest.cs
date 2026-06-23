namespace ExpenseTrackerAPI.Application.DTOs;

/// <summary>
/// Yêu cầu trả tiền theo kỳ hạn
/// </summary>
public class RepaymentRequest
{
    required public int LoanId { get; set; }

    /// <summary>
    /// Kỳ bao nhiêu
    /// </summary>
    public int? Period { get; set; }

    /// <summary>
    /// Tài khoản dùng để trả tiền hoặc nhận tiền trả
    /// </summary>
    required public int AccountId { get; set; }

    /// <summary>
    /// Tổng tiền user trả tại kỳ hiện tại
    /// </summary>
    required public decimal Amount { get; set; }

    /// <summary>
    /// Đơn vị tiền tệ
    /// </summary>
    public string? Currency { get; set; }

    /// <summary>
    /// Note
    /// </summary>
    public string? Note { get; set; }

    /// <summary>
    /// Ngày trả
    /// </summary>
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
}