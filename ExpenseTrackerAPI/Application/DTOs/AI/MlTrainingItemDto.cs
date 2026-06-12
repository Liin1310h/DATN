using System.Transactions;
using ExpenseTrackerAPI.Domain.Enums;

namespace ExpenseTrackerAPI.Application.Interfaces.AI;

public class MlTrainingItemDto
{
    public string Note { get; set; } = string.Empty;
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public int CategoryId { get; set; }
}