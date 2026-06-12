using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ExpenseTrackerAPI.Domain.Enums;

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
    public InterestUnit InterestUnit { get; set; } = InterestUnit.PercentPerMonth; // Đơn vị lãi (tháng/năm)

    public int Duration { get; set; }

    public DurationUnit DurationUnit { get; set; }

    [Required]
    public DateTime StartDate { get; set; } // Ngày bắt đầu vay

    public DateTime? DueDate { get; set; } // Ngày hạn chót phải trả

    public string Note { get; set; } = string.Empty;

    public Boolean IsLending { get; set; } = false;
    public bool IsCompleted { get; set; } = false; // Đã trả hết nợ hay chưa

    /// <summary>
    /// Phương pháp tính lãi: FlatRate (dư nợ ban đầu) hoặc ReducingBalance (dư nợ giảm dần)
    /// </summary>
    public InterestCalculationType InterestCalculationType { get; set; } = InterestCalculationType.ReducingBalance;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    /// <summary>
    /// Nhắc hạn khoản vay?
    /// </summary>
    public bool IsRecurringReminder { get; set; } = false;
    /// <summary>
    /// Nhắc trước bao nhiêu ngày
    /// </summary>
    public int ReminderBeforeDays { get; set; } = 0;
    /// <summary>
    /// Tần suất nhắc lại
    /// </summary>
    public ReminderFrequency ReminderFrequency { get; set; } = ReminderFrequency.Monthly;
    public DateTime? NextReminderDate { get; set; }
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    public virtual ICollection<RepaymentSchedule> Schedules { get; set; } = new List<RepaymentSchedule>();
    // Một khoản vay có thể có nhiều giao dịch trả nợ (Repayments)
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}