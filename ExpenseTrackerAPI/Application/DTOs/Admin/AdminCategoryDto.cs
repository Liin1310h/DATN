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

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(1000)]
    public string? Keywords { get; set; }
}

public class AdminCategoryDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "tag";
    public string Color { get; set; } = "#000000";

    public string? Description { get; set; }
    public string? Keywords { get; set; }

    public int? UserId { get; set; }

    public int TransactionCount { get; set; }
}

public class AdminCategoryDetailDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "tag";
    public string Color { get; set; } = "#000000";

    public string? Description { get; set; }
    public string? Keywords { get; set; }

    public int? UserId { get; set; }

    public int TransactionCount { get; set; }
    public int UsedUserCount { get; set; }

    public bool CanDelete { get; set; }

    public DateTime? LastUsedAt { get; set; }

    public List<AdminCategoryTypeStatDto> TypeStats { get; set; } = new();
}

public class AdminCategoryTypeStatDto
{
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
}