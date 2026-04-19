using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ExpenseTrackerAPI.Domain.Entities;

public class RepaymentSchedule
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int Period { get; set; } //Kỳ?

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PrincipalAmount { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal InterestAmount { get; set; } // Tiền lãi phải trả trong kỳ này

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; } // Tổng cộng (Gốc + Lãi)

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal RemainingBalance { get; set; } // Dư nợ sau kỳ này

    [Required]
    public DateTime DueDate { get; set; } // Ngày hạn chót của kỳ này

    public bool IsPaid { get; set; } = false; // Trạng thái đã thanh toán kỳ này chưa

    public DateTime? PaidDate { get; set; } // Ngày thực tế đã trả


    [Required]
    public int LoanId { get; set; }

    [ForeignKey("LoanId")]
    [JsonIgnore]
    public virtual Loan? Loan { get; set; }
}