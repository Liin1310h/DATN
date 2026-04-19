using ExpenseTrackerAPI.Infrastructure.Data;
using ExpenseTrackerAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Application.Interfaces;

namespace ExpenseTrackerAPI.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _context;
    public CategoryService(AppDbContext context) => _context = context;

    public async Task<IEnumerable<Category>> GetCategoriesByUserIdAsync(int userId)
    {
        return await _context.Categories
            .Where(c => c.UserId == null || c.UserId == userId)
            .ToListAsync();
    }

    public async Task<Category?> GetCategoryByIdAsync(int id, int userId)
    {
        return await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && (c.UserId == userId || c.UserId == null));
    }

    public async Task<Category> CreateCategoryAsync(Category category, int userId)
    {
        category.UserId = userId;
        category.User = null;
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task UpdateCategoryAsync(int id, Category category, int userId)
    {
        var existing = await _context.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (existing == null)
            throw new Exception("Không tìm thấy danh mục hoặc bạn không có quyền sửa danh mục mặc định.");

        category.UserId = userId;
        _context.Entry(category).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteCategoryAsync(int id, int userId)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (category == null)
            throw new Exception("Không tìm thấy danh mục hoặc bạn không có quyền xóa danh mục mặc định.");

        var hasTransactions = await _context.Transactions.AnyAsync(t => t.CategoryId == id);
        if (hasTransactions)
            throw new Exception("Không thể xóa danh mục đang có các giao dịch liên quan.");

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
    }
}