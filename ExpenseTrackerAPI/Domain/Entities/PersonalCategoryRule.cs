using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTrackerAPI.Domain.Entities;

public class PersonalCategoryRule
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Keyword { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = "expense";

    [Required]
    public int CategoryId { get; set; }

    public int Count { get; set; } = 1;

    public DateTime LastUsedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("CategoryId")]
    public virtual Category? Category { get; set; }
}