using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ExpenseTrackerAPI.Domain.Entities;

public class UserSetting
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [StringLength(3)]
    public string DefaultCurrency { get; set; } = "VND"; // USD, EUR, VND...

    [Required]
    [StringLength(10)]
    public string Language { get; set; } = "vi"; // vi-VN, en-US...

    [Required]
    [StringLength(20)]
    public string Theme { get; set; } = "light"; // light, dark

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;


    [ForeignKey("UserId")]
    [JsonIgnore]
    public virtual User? User { get; set; }
}