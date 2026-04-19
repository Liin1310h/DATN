using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ExpenseTrackerAPI.Domain.Entities;

public class Account
{
    [Key]
    public int Id { get; set; }
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    [Required]
    public string Type { get; set; } = "Cash";
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Balance { get; set; }
    [Required]
    public string Currency { get; set; } = "VND";
    public string? Color { get; set; }
    public string? Logo { get; set; }

    [Required]
    public int UserId { get; set; }
    [ForeignKey("UserId")]
    [JsonIgnore]
    public virtual User? User { get; set; }
    [JsonIgnore]
    public virtual ICollection<Transaction> TransactionsFrom { get; set; } = new List<Transaction>();

    [JsonIgnore]
    public virtual ICollection<Transaction> TransactionsTo { get; set; } = new List<Transaction>();
}