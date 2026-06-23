using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using ExpenseTrackerAPI.Domain.Enums;

namespace ExpenseTrackerAPI.Domain.Entities;

/// <summary>
/// Lưu thông tin trả nợ của từng kỳ
/// </summary>
public class RepaymentSchedule
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Kỳ trả nợ thứ bao nhiêu.
    /// </summary>
    [Required]
    public int Period { get; set; }

    /// <summary>
    /// Ngày bắt đầu của kỳ tính lãi.
    /// </summary>
    [Required]
    public DateTime PeriodStartDate { get; set; }

    /// <summary>
    /// Ngày kết thúc của kỳ tính lãi.
    /// </summary>
    [Required]
    public DateTime PeriodEndDate { get; set; }

    /// <summary>
    /// Số ngày tính lãi trong kỳ. Dùng khi khoản vay tính lãi theo ngày thực tế.
    /// </summary>
    public int InterestDays { get; set; }

    /// <summary>
    /// Dư nợ gốc đầu kỳ.
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal OpeningPrincipalBalance { get; set; }

    /// <summary>
    /// Tiền gốc phải trả trong kỳ này.
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PrincipalAmount { get; set; }

    /// <summary>
    /// Tiền lãi phải trả trong kỳ này.
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal InterestAmount { get; set; }

    /// <summary>
    /// Phí phát sinh trong kỳ (phí trả trước hạn hoặc phí dịch vụ).
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal FeeAmount { get; set; } = 0;

    /// <summary>
    /// Tiền phạt phát sinh trong kỳ
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PenaltyAmount { get; set; } = 0;

    /// <summary>
    /// Tổng số tiền phải trả trong kỳ: gốc + lãi + phí + phạt.
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Dư nợ gốc cuối kỳ sau khi trả phần gốc theo kế hoạch.
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal ClosingPrincipalBalance { get; set; }

    /// <summary>
    /// Ngày hạn chót phải thanh toán kỳ này.
    /// </summary>
    [Required]
    public DateTime DueDate { get; set; }

    /// <summary>
    /// Trạng thái thanh toán của kỳ.
    /// </summary>
    public RepaymentScheduleStatus Status { get; set; } = RepaymentScheduleStatus.Pending;

    /// <summary>
    /// Đã thanh toán đủ kỳ này hay chưa
    /// </summary>
    public bool IsPaid { get; set; } = false;

    /// <summary>
    /// Ngày thực tế thanh toán đủ kỳ này.
    /// </summary>
    public DateTime? PaidDate { get; set; }

    /// <summary>
    /// Tiền gốc đã trả.
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidPrincipalAmount { get; set; } = 0;

    /// <summary>
    /// Tiền lãi đã trả.
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidInterestAmount { get; set; } = 0;

    /// <summary>
    /// Tiền phí đã trả.
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidFeeAmount { get; set; } = 0;

    /// <summary>
    /// Tiền phạt đã trả.
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidPenaltyAmount { get; set; } = 0;

    /// <summary>
    /// Tổng tiền đã trả.
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidTotalAmount { get; set; } = 0;

    [NotMapped]
    public decimal UnpaidPrincipalAmount => Math.Max(0, PrincipalAmount - PaidPrincipalAmount);

    [NotMapped]
    public decimal UnpaidInterestAmount => Math.Max(0, InterestAmount - PaidInterestAmount);

    [NotMapped]
    public decimal UnpaidFeeAmount => Math.Max(0, FeeAmount - PaidFeeAmount);

    [NotMapped]
    public decimal UnpaidPenaltyAmount => Math.Max(0, PenaltyAmount - PaidPenaltyAmount);

    /// <summary>
    /// Tổng số tiền còn phải trả của kỳ này.
    /// </summary>
    [NotMapped]
    public decimal UnpaidAmount => Math.Max(0, TotalAmount - PaidTotalAmount);

    /// <summary>
    /// Khoản vay chứa kỳ trả nợ này.
    /// </summary>
    [Required]
    public int LoanId { get; set; }

    [ForeignKey("LoanId")]
    [JsonIgnore]
    public virtual Loan? Loan { get; set; }
}