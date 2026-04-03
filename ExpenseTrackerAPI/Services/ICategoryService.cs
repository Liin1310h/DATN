using ExpenseTrackerAPI.Models;

namespace ExpenseTrackerAPI.Services;

public interface ICategoryService
{
    Task<IEnumerable<Category>> GetCategoriesByUserIdAsync(int userId);
    Task<Category?> GetCategoryByIdAsync(int id, int userId);
    Task<Category> CreateCategoryAsync(Category category, int userId);
    Task UpdateCategoryAsync(int id, Category category, int userId);
    Task DeleteCategoryAsync(int id, int userId);
}