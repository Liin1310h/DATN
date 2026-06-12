using System.Text.Json.Serialization;
using System.Transactions;
using ExpenseTrackerAPI.Domain.Enums;

namespace ExpenseTrackerAPI.Application.Interfaces.AI;

public class MlPredictRequestDto
{
    [JsonPropertyName("note")]
    public string Note { get; set; } = string.Empty;
    [JsonPropertyName("type")]
    public TransactionType Type { get; set; } = TransactionType.Expense;
    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}

