using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ExpenseTrackerAPI.Domain.Entities;

/// <summary>
/// Lưu thông tin của từng kỳ hạn trả tiền
/// </summary>
public class RepaymentSchedule
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Kỳ bao nhiêu
    /// </summary>
    [Required]
    public int Period { get; set; }

    /// <summary>
    /// Tiền gốc
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PrincipalAmount { get; set; }

    /// <summary>
    /// Tiền lãi phải trả trong kỳ này
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal InterestAmount { get; set; }

    /// <summary>
    /// Tổng cộng (Gốc + Lãi)
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Dư nợ sau kỳ này
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal RemainingBalance { get; set; }

    /// <summary>
    /// Ngày hạn chót của kỳ này
    /// </summary>
    [Required]
    public DateTime DueDate { get; set; }

    /// <summary>
    /// Trạng thái đã thanh toán kỳ này chưa
    /// </summary>
    public bool IsPaid { get; set; } = false;

    /// <summary>
    /// Ngày thực tế đã trả
    /// </summary>
    public DateTime? PaidDate { get; set; }

    /// <summary>
    /// Tiền gốc đã trả
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidPrincipalAmount { get; set; } = 0;

    /// <summary>
    /// Tiền lãi đã trả
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidInterestAmount { get; set; } = 0;

    /// <summary>
    /// Tổng tiền đã trả
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidTotalAmount { get; set; } = 0;

    /// <summary>
    /// Tiền chênh lệch so với kế hoạch
    /// </summary>
    [NotMapped]
    public decimal UnpaidAmount => TotalAmount - PaidTotalAmount;
    /// <summary>
    /// Khoá ngoại
    /// </summary>
    [Required]
    public int LoanId { get; set; }

    [ForeignKey("LoanId")]
    [JsonIgnore]
    public virtual Loan? Loan { get; set; }
}