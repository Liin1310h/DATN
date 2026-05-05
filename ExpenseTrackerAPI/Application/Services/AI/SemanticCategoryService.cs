using System.Net.Http.Json;
using ExpenseTrackerAPI.Application.DTOs.AI;
using ExpenseTrackerAPI.Application.Interfaces.AI;
using ExpenseTrackerAPI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Application.Services.AI;

public class SemanticCategoryService : ISemanticCategoryService
{
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;

    public SemanticCategoryService(
        AppDbContext context,
        HttpClient httpClient)
    {
        _context = context;
        _httpClient = httpClient;
    }

    public async Task<SemanticPredictResponseDto?> PredictAsync(
        int userId,
        PredictCategoryRequest request)
    {
        var categories = await _context.Categories
            .Where(c => c.UserId == null || c.UserId == userId)
            .Select(c => new SemanticCategoryItemDto
            {
                Id = c.Id,
                Name = c.Name,

                // hiện tại entity Category chưa có Description/Keywords
                // nên tạm build từ Name
                Description = BuildDefaultDescription(c.Name),
                Keywords = BuildDefaultKeywords(c.Name)
            })
            .ToListAsync();

        if (!categories.Any())
            return null;

        var payload = new SemanticPredictRequestDto
        {
            Note = request.Note,
            Type = request.Type,
            Amount = request.Amount,
            Categories = categories
        };

        var response = await _httpClient.PostAsJsonAsync(
            "/semantic/predict",
            payload
        );

        if (!response.IsSuccessStatusCode)
            return null;

        return await response.Content.ReadFromJsonAsync<SemanticPredictResponseDto>();
    }

    private static string BuildDefaultDescription(string categoryName)
    {
        var name = categoryName.Trim().ToLower();

        return name switch
        {
            "ăn uống" => "Các khoản chi cho ăn uống, đồ ăn, đồ uống, cafe, trà sữa, nhà hàng.",
            "di chuyển" => "Các khoản chi cho đi lại, taxi, grab, xe bus, xăng xe, vé tàu, vé máy bay.",
            "mua sắm" => "Các khoản chi cho quần áo, giày dép, mỹ phẩm, điện thoại, laptop, đồ gia dụng.",
            "giải trí" => "Các khoản chi cho xem phim, karaoke, du lịch, cắm trại, game, concert, netflix.",
            "hoá đơn" => "Các khoản chi cho điện nước, internet, wifi, tiền nhà, bảo hiểm, trả góp.",
            _ => $"Danh mục chi tiêu: {categoryName}."
        };
    }

    private static string BuildDefaultKeywords(string categoryName)
    {
        var name = categoryName.Trim().ToLower();

        return name switch
        {
            "ăn uống" => "ăn, uống, phở, bún, cơm, cafe, cà phê, trà sữa, nhà hàng, đồ ăn",
            "di chuyển" => "grab, taxi, xe bus, xăng, gửi xe, rửa xe, sửa xe, vé tàu, vé máy bay",
            "mua sắm" => "mua, áo, giày, quần, mỹ phẩm, điện thoại, laptop, tai nghe, đồ gia dụng",
            "giải trí" => "xem phim, karaoke, du lịch, cắm trại, game, concert, netflix, picnic",
            "hoá đơn" => "điện, nước, internet, wifi, tiền nhà, bảo hiểm, trả góp, thẻ tín dụng",
            _ => categoryName
        };
    }
}