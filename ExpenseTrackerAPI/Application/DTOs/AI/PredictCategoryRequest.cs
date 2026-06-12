using System.Transactions;
using ExpenseTrackerAPI.Domain.Enums;

namespace ExpenseTrackerAPI.Application.DTOs.AI;

public class PredictCategoryRequest
{
    public string Note { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public TransactionType Type { get; set; } = TransactionType.Expense;
}