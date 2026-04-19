using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTrackerAPI.Domain.Entities;

public class Loan
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }
    [Required]
    public string Currency { get; set; } = "VND";
    [Required]
    [MaxLength(255)]
    public string CounterPartyName { get; set; } = string.Empty; // Tên người vay/cho vay

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PrincipalAmount { get; set; } // Số tiền gốc ban đầu

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal RemainingAmount { get; set; } // Số tiền nợ còn lại

    [Column(TypeName = "decimal(5,2)")]
    public decimal InterestRate { get; set; } = 0; // Lãi suất (%)

    [MaxLength(50)]
    public string InterestUnit { get; set; } = "percent_per_month"; // Đơn vị lãi (tháng/năm)

    [Required]
    public DateTime StartDate { get; set; } // Ngày bắt đầu vay

    public DateTime? DueDate { get; set; } // Ngày hạn chót phải trả

    public string Note { get; set; } = string.Empty;

    public Boolean IsLending { get; set; } = false;
    public bool IsCompleted { get; set; } = false; // Đã trả hết nợ hay chưa

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    public virtual ICollection<RepaymentSchedule> Schedules { get; set; } = new List<RepaymentSchedule>();
    // Một khoản vay có thể có nhiều giao dịch trả nợ (Repayments)
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}