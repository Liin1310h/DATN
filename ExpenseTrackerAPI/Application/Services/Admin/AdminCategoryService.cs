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

    /// <summary>
    /// Lấy danh sách danh mục hệ thống với tìm kiếm
    /// </summary>
    /// <param name="search"></param>
    /// <returns></returns>
    public async Task<IEnumerable<AdminCategoryDto>> GetSystemCategoriesAsync(string? search)
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

    /// <summary>
    /// Tạo danh mục hệ thống mới
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async Task<AdminCategoryDto> CreateSystemCategoryAsync(AdminCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new Exception("Tên danh mục không được để trống.");

        var name = NormalizeCategoryName(request.Name);

        var exists = await IsSystemCategoryNameDuplicatedAsync(name);

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

    /// <summary>
    /// Cập nhật danh mục hệ thống
    /// </summary>
    /// <param name="id"></param>
    /// <param name="request"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async Task<AdminCategoryDto> UpdateSystemCategoryAsync(int id, AdminCategoryRequest request)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == null);

        if (category == null)
            throw new Exception("Danh mục hệ thống không tồn tại.");

        var name = NormalizeCategoryName(request.Name);

        if (string.IsNullOrWhiteSpace(name))
            throw new Exception("Tên danh mục không được để trống.");

        var duplicate = await IsSystemCategoryNameDuplicatedAsync(name, excludeCategoryId: id);

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

    /// <summary>
    /// Xoá danh mục hệ thống
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
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

    /// <summary>
    /// Lấy chi tiết danh mục hệ thống
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async Task<AdminCategoryDetailDto> GetSystemCategoryByIdAsync(int id)
    {
        var category = await _context.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == null);

        if (category == null)
            throw new Exception("Danh mục hệ thống không tồn tại.");

        var transactionQuery = _context.Transactions
            .AsNoTracking()
            .Where(t => t.CategoryId == id);

        var transactionCount = await transactionQuery.CountAsync();

        var usedUserCount = await transactionQuery
            .Select(t => t.UserId)
            .Distinct()
            .CountAsync();

        var lastUsedAt = await transactionQuery
            .OrderByDescending(t => t.TransactionDate)
            .Select(t => (DateTime?)t.TransactionDate)
            .FirstOrDefaultAsync();

        var typeStats = await transactionQuery
            .GroupBy(t => t.Type)
            .Select(g => new AdminCategoryTypeStatDto
            {
                Type = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        return new AdminCategoryDetailDto
        {
            Id = category.Id,
            Name = category.Name,
            Icon = category.Icon,
            Color = category.Color,
            Description = category.Description,
            Keywords = category.Keywords,
            UserId = category.UserId,

            TransactionCount = transactionCount,
            UsedUserCount = usedUserCount,
            LastUsedAt = lastUsedAt,
            CanDelete = transactionCount == 0,
            TypeStats = typeStats
        };
    }

    /// <summary>
    /// Chuẩn hoá tên danh mục
    /// </summary>
    /// <param name="name"></param>
    /// <returns></returns>
    private static string NormalizeCategoryName(string name)
    {
        return string.Join(" ", name.Trim().Split(
            ' ',
            StringSplitOptions.RemoveEmptyEntries
        ));
    }

    /// <summary>
    /// Check trùng lặp tên danh mục hệ thống
    /// </summary>
    /// <param name="name"></param>
    /// <param name="excludeCategoryId"></param>
    /// <returns></returns>
    private async Task<bool> IsSystemCategoryNameDuplicatedAsync(string name, int? excludeCategoryId = null)
    {
        var normalizedName = NormalizeCategoryName(name).ToLower();

        return await _context.Categories.AnyAsync(c =>
            c.UserId == null &&
            c.Name.ToLower() == normalizedName &&
            (!excludeCategoryId.HasValue || c.Id != excludeCategoryId.Value)
        );
    }
    /// <summary>
    /// Chuyển dữ liệu Category sang AdminCategoryDto => return cho frontend
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
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

    /// <summary>
    /// Tạo default description dựa trên tên danh mục, giúp admin không phải nhập tay nếu muốn
    /// </summary>
    /// <param name="categoryName"></param>
    /// <returns></returns>
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

    /// <summary>
    /// Tạo default keywords dựa trên tên danh mục, giúp admin không phải nhập tay nếu muốn
    /// </summary>
    /// <param name="categoryName"></param>
    /// <returns></returns>
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