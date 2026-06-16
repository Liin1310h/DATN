using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTrackerAPI.Domain.Entities;

public class Budget
{
    [Key]
    public int Id { get; set; }
    [Required]
    public int UserId { get; set; }
    [Required]
    public int CategoryId { get; set; }

    [Required]
    [MaxLength(7)]
    public string Month { get; set; } = null!;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal Spent { get; set; } = 0;

    [Required]
    [MaxLength(5)]
    public string Currency { get; set; } = "VND";

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Category Category { get; set; } = null!;
}