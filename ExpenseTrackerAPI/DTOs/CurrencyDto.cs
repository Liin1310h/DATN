using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ExpenseTrackerAPI.DTOs;

public class Currency
{
    [Required]
    [JsonPropertyName("base")]
    public required string Base {get;set;}
    [Required]
    [JsonPropertyName("rates")]
    public required Dictionary<String, decimal> Rates {get;set;}
}