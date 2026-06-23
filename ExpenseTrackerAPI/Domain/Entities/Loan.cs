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
    [MaxLength(10)]
    public string Currency { get; set; } = "VND";
    /// <summary>
    /// Loại đối tượng vay
    /// </summary>
    public LoanCounterPartyType CounterPartyType { get; set; } = LoanCounterPartyType.Personal;
    /// <summary>
    /// Đối tượng vay/ cho vay
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string CounterPartyName { get; set; } = string.Empty;

    /// <summary>
    /// Số tiền gốc ban đầu
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PrincipalAmount { get; set; }

    /// <summary>
    /// Dư nợ gốc còn lại, không bao gồm lãi, phí và phạt.
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal RemainingPrincipalAmount { get; set; }

    /// <summary>
    /// Lãi suất (%)
    /// </summary>
    [Column(TypeName = "decimal(9,4)")]
    public decimal InterestRate { get; set; } = 0;

    /// <summary>
    /// Đơn vị lãi 
    /// </summary>
    public InterestUnit InterestUnit { get; set; } = InterestUnit.PercentPerMonth;

    /// <summary>
    /// Số kỳ
    /// </summary>
    public int Duration { get; set; }

    /// <summary>
    /// Đơn vị kỳ
    /// </summary>
    public DurationUnit DurationUnit { get; set; } = DurationUnit.Month;

    /// <summary>
    /// Ngày bắt đầu vay
    /// </summary>
    [Required]
    public DateTime StartDate { get; set; }

    /// <summary>
    /// Ngày đáo hạn khoản vay
    /// </summary>
    [Required]
    public DateTime DueDate { get; set; }

    public string Note { get; set; } = string.Empty;

    public bool IsLending { get; set; } = false;
    /// <summary>
    /// Trạng thái khoản vay
    /// </summary>
    public LoanStatus Status { get; set; } = LoanStatus.Active;

    /// <summary>
    /// Phương thức trả nợ
    /// </summary>
    public RepaymentMethod RepaymentMethod { get; set; } = RepaymentMethod.NoInterest;
    /// <summary>
    /// Chính sách trả nợ
    /// </summary>
    public PrepaymentPolicy PrepaymentPolicy { get; set; } = PrepaymentPolicy.NotAllowed;
    /// <summary>
    /// Thứ tự ưu tiên trả nợ
    /// </summary>
    public PaymentAllocationStrategy AllocationStrategy { get; set; } = PaymentAllocationStrategy.InterestPrincipal;
    /// <summary>
    /// Phí trả chậm
    /// </summary>
    [Column(TypeName = "decimal(9,4)")]
    public decimal? LateFeeRate { get; set; }
    /// <summary>
    /// Phí trả trước
    /// </summary>
    [Column(TypeName = "decimal(9,4)")]
    public decimal? PrepaymentFeeRate { get; set; }
    /// <summary>
    /// Trả ngày bao nhiêu của tháng
    /// </summary>
    public int? PaymentDayOfMonth { get; set; }
    /// <summary>
    /// Nếu true, lãi được tính theo số ngày thực tế giữa các kỳ thay vì quy đổi cố định theo tháng
    /// </summary>
    public bool IsInterestAccruedDaily { get; set; }
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