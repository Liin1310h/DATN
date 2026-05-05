using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Domain.Entities;

namespace ExpenseTrackerAPI.Application.Interfaces.Admin;

public interface IAdminCategoryService
{
    Task<IEnumerable<Category>> GetSystemCategoriesAsync(string? search);
    Task<Category> CreateSystemCategoryAsync(AdminCategoryRequest request);
    Task<Category> UpdateSystemCategoryAsync(int id, AdminCategoryRequest request);
    Task DeleteSystemCategoryAsync(int id);
}