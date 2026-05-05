using ExpenseTrackerAPI.Application.DTOs.AI;

namespace ExpenseTrackerAPI.Application.Interfaces.AI;

public interface IGlobalCategoryMlService
{
    Task TrainAsync();
    Task<MlPredictResponseDto?> PredictAsync(
        string note,
        decimal amount,
        string type);

}