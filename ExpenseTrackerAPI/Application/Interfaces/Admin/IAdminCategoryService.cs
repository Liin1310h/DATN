using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Domain.Entities;

namespace ExpenseTrackerAPI.Application.Interfaces.Admin;

public interface IAdminCategoryService
{
    Task<IEnumerable<AdminCategoryDto>> GetSystemCategoriesAsync(string? search);
    Task<AdminCategoryDto> CreateSystemCategoryAsync(AdminCategoryRequest request);
    Task<AdminCategoryDto> UpdateSystemCategoryAsync(int id, AdminCategoryRequest request);
    Task DeleteSystemCategoryAsync(int id);
}