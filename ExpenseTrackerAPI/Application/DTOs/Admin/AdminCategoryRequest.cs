using System.ComponentModel.DataAnnotations;

namespace ExpenseTrackerAPI.Application.DTOs;

public class AdminCategoryRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Icon { get; set; } = "tag";

    [Required]
    [MaxLength(20)]
    public string Color { get; set; } = "#000000";
}