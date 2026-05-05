using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ExpenseTrackerAPI.Domain.Entities;

public class User
{
    [Key]
    public int Id { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "User"; // "Admin", "User"

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;

    [JsonIgnore]
    public virtual ICollection<Account> Accounts { get; set; } = new List<Account>();

    [JsonIgnore]
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

    [JsonIgnore]
    public virtual ICollection<Category> Categories { get; set; } = new List<Category>();

    [JsonIgnore]
    public virtual ICollection<Loan> Loans { get; set; } = new List<Loan>();

    [JsonIgnore]
    public virtual ICollection<Budget> Budgets { get; set; } = new List<Budget>();

    [JsonIgnore]
    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}