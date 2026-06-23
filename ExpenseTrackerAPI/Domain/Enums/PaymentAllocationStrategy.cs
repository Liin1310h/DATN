namespace ExpenseTrackerAPI.Domain.Enums;

/// <summary>
/// Thứ tự ưu tiên trả
/// </summary>
public enum PaymentAllocationStrategy
{
    /// <summary>
    /// Phí => phạt => lãi quá hạn => lãi trong hạn => gốc
    /// </summary>
    FeePenaltyInterestPrincipal = 1,
    /// <summary>
    /// Lãi => gốc
    /// </summary>
    InterestPrincipal = 2,
    /// <summary>
    /// Gốc => lãi
    /// </summary>
    PrincipalInterest = 3
}