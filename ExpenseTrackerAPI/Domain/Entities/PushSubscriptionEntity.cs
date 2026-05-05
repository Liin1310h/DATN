using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTrackerAPI.Domain.Entities;

public class PushSubscriptionEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public string Endpoint { get; set; } = string.Empty;

    [Required]
    public string P256dh { get; set; } = string.Empty;

    [Required]
    public string Auth { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}