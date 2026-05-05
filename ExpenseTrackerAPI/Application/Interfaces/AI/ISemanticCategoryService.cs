using ExpenseTrackerAPI.Application.DTOs.AI;

namespace ExpenseTrackerAPI.Application.Interfaces.AI;

public interface ISemanticCategoryService
{
    Task<SemanticPredictResponseDto?> PredictAsync( int userId, PredictCategoryRequest request
    );
}