using System.Text.Json.Serialization;

namespace ExpenseTrackerAPI.Application.Interfaces.AI;

public class MlPredictRequestDto
{
    [JsonPropertyName("note")]
    public string Note { get; set; } = string.Empty;
    [JsonPropertyName("type")]
    public string Type { get; set; } = "expense";
    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}

