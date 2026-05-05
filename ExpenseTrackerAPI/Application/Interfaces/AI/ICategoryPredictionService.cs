using ExpenseTrackerAPI.Application.DTOs.AI;

namespace ExpenseTrackerAPI.Application.Interfaces.AI;

public interface ICategoryPredictionService
{
    Task<PredictCategoryResponse> PredictAsync(int userId, PredictCategoryRequest request);
}