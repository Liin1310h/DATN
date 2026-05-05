using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ExpenseTrackerAPI.Domain.Entities;

public class TransactionImage
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TransactionId { get; set; }

    [ForeignKey("TransactionId")]
    [JsonIgnore]
    public virtual Transaction? Transaction { get; set; }

    [Required]
    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}