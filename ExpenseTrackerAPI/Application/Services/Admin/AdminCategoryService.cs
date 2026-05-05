using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Application.Interfaces.Admin;
using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Application.Services.Admin;

public class AdminCategoryService : IAdminCategoryService
{
    private readonly AppDbContext _context;

    public AdminCategoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Category>> GetSystemCategoriesAsync(string? search)
    {
        var query = _context.Categories
            .Where(x => x.UserId == null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(keyword));
        }

        return await query
            .OrderBy(x => x.Name)
            .ToListAsync();
    }

    public async Task<Category> CreateSystemCategoryAsync(AdminCategoryRequest request)
    {
        var exists = await _context.Categories.AnyAsync(x =>
            x.UserId == null &&
            x.Name.ToLower() == request.Name.Trim().ToLower());

        if (exists)
            throw new Exception("Danh mục hệ thống đã tồn tại.");

        var category = new Category
        {
            Name = request.Name.Trim(),
            Icon = request.Icon.Trim(),
            Color = request.Color.Trim(),
            UserId = null
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return category;
    }

    public async Task<Category> UpdateSystemCategoryAsync(int id, AdminCategoryRequest request)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == null);

        if (category == null)
            throw new Exception("Danh mục hệ thống không tồn tại.");

        category.Name = request.Name.Trim();
        category.Icon = request.Icon.Trim();
        category.Color = request.Color.Trim();

        await _context.SaveChangesAsync();
        return category;
    }

    public async Task DeleteSystemCategoryAsync(int id)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == null);

        if (category == null)
            throw new Exception("Danh mục hệ thống không tồn tại.");

        var isUsed = await _context.Transactions.AnyAsync(x => x.CategoryId == id);
        if (isUsed)
            throw new Exception("Danh mục đang được sử dụng, không thể xóa.");

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
    }
}