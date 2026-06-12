using ExpenseTrackerAPI.Application.DTOs.AI;
using ExpenseTrackerAPI.Domain.Enums;

namespace ExpenseTrackerAPI.Application.Interfaces.AI;

public interface IGlobalCategoryMlService
{
    Task TrainAsync();
    Task<MlPredictResponseDto?> PredictAsync(
        string note,
        decimal amount,
        TransactionType type);

}