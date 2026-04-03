using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ExpenseTrackerAPI.Models;

public class Transaction
{
    [Key]
    public int Id { get; set; }
    [Required]
    [MaxLength(5)]
    public string Currency { get; set; } = "VND";
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; } // Tiền gốc

    [Column(TypeName = "decimal(18,2)")]
    public decimal? ConvertedAmount { get; set; } // Số tiền sau quy đổi (nếu khác tiền tệ)

    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceBefore { get; set; } // Số dư trước khi giao dịch

    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceAfter { get; set; } // Số dư sau khi giao dịch

    public string Note { get; set; } = string.Empty;

    [Required]
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

    public string ImageUrl { get; set; } = string.Empty; // Ảnh hóa đơn

    [Required]
    [MaxLength(20)]
    public string Type { get; set; } // "expense", "income", "lend", "borrow", "transfer"

    [Required]
    public int UserId { get; set; }

    [ForeignKey("UserId")]
    [JsonIgnore]
    public virtual User? User { get; set; }

    public int? FromAccountId { get; set; }
    [ForeignKey("FromAccountId")]
    public virtual Account? FromAccount { get; set; }

    public int? ToAccountId { get; set; }
    [ForeignKey("ToAccountId")]
    public virtual Account? ToAccount { get; set; }

    public int? CategoryId { get; set; }
    [ForeignKey("CategoryId")]
    public virtual Category? Category { get; set; }

    public int? LoanId { get; set; }
    [ForeignKey("LoanId")]
    public virtual Loan? Loan { get; set; }
}