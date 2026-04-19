using System.ComponentModel.DataAnnotations;

namespace ExpenseTrackerAPI.Domain.Entities;

public class Budget
{
    [Key]
    public int Id { get; set; }
    [Required]
    public int UserId { get; set; }
    [Required]
    public int CategoryId { get; set; }
    public string Month { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Category Category { get; set; } = null!;
}