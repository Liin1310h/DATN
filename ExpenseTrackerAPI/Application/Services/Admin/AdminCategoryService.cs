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

    public async Task<IEnumerable<AdminCategoryDto>> GetSystemCategoriesAsync(
        string? search
    )
    {
        var query = _context.Categories
            .AsNoTracking()
            .Where(x => x.UserId == null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();

            query = query.Where(x =>
                x.Name.ToLower().Contains(keyword) ||
                (
                    x.Description != null &&
                    x.Description.ToLower().Contains(keyword)
                ) ||
                (
                    x.Keywords != null &&
                    x.Keywords.ToLower().Contains(keyword)
                )
            );
        }

        return await query
            .OrderBy(x => x.Name)
            .Select(x => new AdminCategoryDto
            {
                Id = x.Id,
                Name = x.Name,
                Icon = x.Icon,
                Color = x.Color,
                Description = x.Description,
                Keywords = x.Keywords,
                UserId = x.UserId,

                TransactionCount = _context.Transactions.Count(t =>
                    t.CategoryId == x.Id
                )
            })
            .ToListAsync();
    }

    public async Task<AdminCategoryDto> CreateSystemCategoryAsync(
        AdminCategoryRequest request
    )
    {
        var name = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
            throw new Exception("Tên danh mục không được để trống.");

        var exists = await _context.Categories.AnyAsync(x =>
            x.UserId == null &&
            x.Name.ToLower() == name.ToLower()
        );

        if (exists)
            throw new Exception("Danh mục hệ thống đã tồn tại.");

        var category = new Category
        {
            Name = name,
            Icon = string.IsNullOrWhiteSpace(request.Icon)
                ? "tag"
                : request.Icon.Trim(),

            Color = string.IsNullOrWhiteSpace(request.Color)
                ? "#000000"
                : request.Color.Trim(),

            Description = string.IsNullOrWhiteSpace(request.Description)
                ? BuildDefaultDescription(name)
                : request.Description.Trim(),

            Keywords = string.IsNullOrWhiteSpace(request.Keywords)
                ? BuildDefaultKeywords(name)
                : request.Keywords.Trim(),

            UserId = null
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return await MapToAdminCategoryDtoAsync(category.Id);
    }

    public async Task<AdminCategoryDto> UpdateSystemCategoryAsync(
        int id,
        AdminCategoryRequest request
    )
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == null);

        if (category == null)
            throw new Exception("Danh mục hệ thống không tồn tại.");

        var name = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
            throw new Exception("Tên danh mục không được để trống.");

        var duplicate = await _context.Categories.AnyAsync(x =>
            x.Id != id &&
            x.UserId == null &&
            x.Name.ToLower() == name.ToLower()
        );

        if (duplicate)
            throw new Exception("Tên danh mục hệ thống đã tồn tại.");

        category.Name = name;

        category.Icon = string.IsNullOrWhiteSpace(request.Icon)
            ? "tag"
            : request.Icon.Trim();

        category.Color = string.IsNullOrWhiteSpace(request.Color)
            ? "#000000"
            : request.Color.Trim();

        category.Description = string.IsNullOrWhiteSpace(request.Description)
            ? BuildDefaultDescription(name)
            : request.Description.Trim();

        category.Keywords = string.IsNullOrWhiteSpace(request.Keywords)
            ? BuildDefaultKeywords(name)
            : request.Keywords.Trim();

        await _context.SaveChangesAsync();

        return await MapToAdminCategoryDtoAsync(category.Id);
    }

    public async Task DeleteSystemCategoryAsync(int id)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == null);

        if (category == null)
            throw new Exception("Danh mục hệ thống không tồn tại.");

        var isUsed = await _context.Transactions.AnyAsync(x =>
            x.CategoryId == id
        );

        if (isUsed)
            throw new Exception("Danh mục đang được sử dụng, không thể xóa.");

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
    }

    private async Task<AdminCategoryDto> MapToAdminCategoryDtoAsync(int id)
    {
        var result = await _context.Categories
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new AdminCategoryDto
            {
                Id = x.Id,
                Name = x.Name,
                Icon = x.Icon,
                Color = x.Color,
                Description = x.Description,
                Keywords = x.Keywords,
                UserId = x.UserId,

                TransactionCount = _context.Transactions.Count(t =>
                    t.CategoryId == x.Id
                )
            })
            .FirstOrDefaultAsync();

        if (result == null)
            throw new Exception("Không tìm thấy danh mục.");

        return result;
    }

    private static string BuildDefaultDescription(string categoryName)
    {
        var name = categoryName.Trim().ToLower();

        return name switch
        {
            "ăn uống" =>
                "Các khoản chi cho ăn uống, đồ ăn, đồ uống, cafe, trà sữa, nhà hàng.",

            "di chuyển" =>
                "Các khoản chi cho đi lại, taxi, grab, xe bus, xăng xe, gửi xe, vé tàu, vé máy bay.",

            "mua sắm" =>
                "Các khoản chi cho quần áo, giày dép, mỹ phẩm, điện thoại, laptop, đồ gia dụng.",

            "giải trí" =>
                "Các khoản chi cho xem phim, karaoke, du lịch, cắm trại, game, concert, netflix.",

            "hoá đơn" or "hóa đơn" =>
                "Các khoản chi cho điện nước, internet, wifi, tiền nhà, bảo hiểm, trả góp.",

            "sức khỏe" =>
                "Các khoản chi cho khám bệnh, thuốc, bệnh viện, nha khoa, bảo hiểm y tế, chăm sóc sức khỏe.",

            "giáo dục" =>
                "Các khoản chi cho học phí, sách vở, khóa học, tài liệu, chứng chỉ, đào tạo.",

            _ => $"Danh mục chi tiêu: {categoryName}."
        };
    }

    private static string BuildDefaultKeywords(string categoryName)
    {
        var name = categoryName.Trim().ToLower();

        return name switch
        {
            "ăn uống" =>
                "ăn, uống, phở, bún, cơm, cafe, cà phê, trà sữa, nhà hàng, đồ ăn, nước uống",

            "di chuyển" =>
                "grab, taxi, xe bus, xăng, gửi xe, rửa xe, sửa xe, vé tàu, vé máy bay, đi lại",

            "mua sắm" =>
                "mua, áo, giày, quần, mỹ phẩm, điện thoại, laptop, tai nghe, đồ gia dụng",

            "giải trí" =>
                "xem phim, karaoke, du lịch, cắm trại, game, concert, netflix, picnic",

            "hoá đơn" or "hóa đơn" =>
                "điện, nước, internet, wifi, tiền nhà, bảo hiểm, trả góp, thẻ tín dụng",

            "sức khỏe" =>
                "thuốc, khám bệnh, bệnh viện, nha khoa, bảo hiểm y tế, sức khỏe, bác sĩ",

            "giáo dục" =>
                "học phí, sách, khóa học, tài liệu, chứng chỉ, đào tạo, học tập",

            _ => categoryName
        };
    }
}