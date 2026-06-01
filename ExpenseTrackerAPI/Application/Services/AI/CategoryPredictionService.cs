using ExpenseTrackerAPI.Application.DTOs.AI;
using ExpenseTrackerAPI.Application.Interfaces.AI;
using ExpenseTrackerAPI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Application.Services.AI;
/// <summary>
/// TODO Hàm dự đoán category dựa trên note và type
/// <rule personal> => <rule global ML> => <semantic fallback>
/// </summary>
public class CategoryPredictionService : ICategoryPredictionService
{
    private readonly AppDbContext _context;
    private readonly IGlobalCategoryMlService _globalCategoryPythonMlService;
    private readonly ISemanticCategoryService _semanticCategoryService;
    public CategoryPredictionService(AppDbContext context, IGlobalCategoryMlService globalCategoryPythonMlService, ISemanticCategoryService semanticCategoryService)
    {
        _context = context;
        _globalCategoryPythonMlService = globalCategoryPythonMlService;
        _semanticCategoryService = semanticCategoryService;
    }

    // Các ngưỡng conf
    const double PersonalRuleThreshold = 0.5;
    const double MlThreshold = 0.65;
    const double SemanticThreshold = 0.5;

    /// <summary>
    /// Hàm dự đoán category dựa trên note và type
    /// ! chỉ dự đoán cho income và expense
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="request"></param> (note, amount, type)
    /// <returns></returns>
    public async Task<PredictCategoryResponse> PredictAsync(int userId, PredictCategoryRequest request)
    {
        var note = Normalize(request.Note);
        var type = Normalize(request.Type);

        if (string.IsNullOrWhiteSpace(note))
        {
            return new PredictCategoryResponse
            {
                CategoryId = null,
                Confidence = 0,
                Source = "none",
                Message = "Note trống, không thể dự đoán."
            };
        }

        if (type != "expense" && type != "income")
        {
            return new PredictCategoryResponse
            {
                CategoryId = null,
                Confidence = 0,
                Source = "none",
                Message = "Chỉ hỗ trợ dự đoán cho expense/income."
            };
        }

        // TODO Rule cá nhân dựa trên lịch sử giao dịch của user
        var personal = await PredictByPersonalRuleAsync(userId, note, type);

        if (personal.CategoryId != null && personal.Confidence >= PersonalRuleThreshold)
            return personal;

        // TODO Gọi ML global
        var mlResult = await _globalCategoryPythonMlService.PredictAsync(request.Note, request.Amount, type);
        Console.WriteLine($"ML global returned: CategoryId={mlResult?.CategoryId}, Confidence={mlResult?.Confidence}");
        if (mlResult?.CategoryId != null && mlResult.Confidence >= MlThreshold)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c =>
                    c.Id == mlResult.CategoryId.Value &&
                    (c.UserId == null || c.UserId == userId));
            Console.WriteLine($"ML returned CategoryId={mlResult.CategoryId.Value}, but category was not found in database.");
            if (category != null)
            {
                return new PredictCategoryResponse
                {
                    CategoryId = category?.Id,
                    CategoryName = category?.Name,
                    Confidence = mlResult.Confidence,
                    Source = "ml_global",
                    Message = "Gợi ý bằng ML global Python."
                };
            }
        }

        // TODO semantic fallback
        var semantic = await _semanticCategoryService.PredictAsync(userId, request);

        if (semantic != null && semantic.CategoryId != null && semantic.Confidence >= SemanticThreshold)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c =>
                    c.Id == semantic.CategoryId.Value &&
                    (c.UserId == null || c.UserId == userId));

            if (category != null)
            {
                return new PredictCategoryResponse
                {
                    CategoryId = category?.Id,
                    CategoryName = category?.Name,
                    Confidence = semantic.Confidence,
                    Source = "semantic",
                    Message = semantic.Reason ?? "Gợi ý bằng semantic embedding."
                };
            }
        }

        if (personal.CategoryId != null)
            return personal;

        return new PredictCategoryResponse
        {
            CategoryId = null,
            Confidence = 0,
            Source = "none",
            Message = "Chưa đủ dữ liệu để gợi ý category."
        };
    }


    /// <summary>
    /// TODO Dự đoán dựa trên rule cá nhân
    /// Tìm trong lịch sử giao dịch của user xem có note nào tương tự không
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="normalizedNote"></param>
    /// <param name="type"></param>
    /// <returns></returns>
    private async Task<PredictCategoryResponse> PredictByPersonalRuleAsync(
    int userId,
    string normalizedNote,
    string type)
    {
        var keywords = ExtractKeywords(normalizedNote);

        if (keywords.Count == 0)
        {
            return new PredictCategoryResponse
            {
                CategoryId = null,
                Confidence = 0,
                Source = "personal_rule",
                Message = "Không có keyword phù hợp."
            };
        }

        var rules = await _context.PersonalCategoryRules
            .Include(x => x.Category)
            .Where(x =>
                x.UserId == userId &&
                x.Type == type &&
                keywords.Contains(x.Keyword))
            .ToListAsync();

        if (!rules.Any())
        {
            return new PredictCategoryResponse
            {
                CategoryId = null,
                Confidence = 0,
                Source = "personal_rule",
                Message = "Không tìm thấy personal rule."
            };
        }

        var grouped = rules
            .GroupBy(x => new
            {
                x.CategoryId,
                CategoryName = x.Category != null ? x.Category.Name : null
            })
            .Select(g => new
            {
                g.Key.CategoryId,
                g.Key.CategoryName,
                Score = g.Sum(x => x.Count)
            })
            .OrderByDescending(x => x.Score)
            .First();

        var totalScore = rules.Sum(x => x.Count);
        var usageFactor = Math.Min(1.0, Math.Log10(grouped.Score + 1));
        var confidence = totalScore > 0
            ? Math.Min(0.99, ((double)grouped.Score / totalScore) * usageFactor)
            : 0;

        return new PredictCategoryResponse
        {
            CategoryId = grouped.CategoryId,
            CategoryName = grouped.CategoryName,
            Confidence = confidence,
            Source = "personal_rule",
            Message = "Gợi ý dựa trên rule cá nhân đã cache."
        };
    }

    /// <summary>
    /// Chuyển thành chữ thường, xoá khoảng trắng
    /// </summary>
    /// <param name="value"></param>
    /// <returns></returns>
    private static string Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : value.Trim().ToLowerInvariant();
    }

    /// <summary>
    /// Hàm tách note thành các keyword, loại bỏ stop words, chỉ giữ lại từ có 2 ký tự trở lên
    /// </summary>
    /// <param name="note"></param>
    /// <returns></returns>
    private static List<string> ExtractKeywords(string note)
    {
        var stopWords = new HashSet<string>
    {
        "cho", "cua", "của", "va", "và", "voi", "với",
        "mua", "tra", "trả", "thanh", "toan", "toán",
        "chuyen", "chuyển", "khoan", "khoản",
        "đi", "di", "ở", "tai", "tại"
    };

        var ambiguousWords = new HashSet<string>
    {
        "nước", "nuoc",
        "tiền", "tien",
        "phí", "phi",
        "đồ", "do",
        "món", "mon"
    };

        var words = note
            .Trim()
            .ToLowerInvariant()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim())
            .Where(x => x.Length >= 2)
            .Where(x => !stopWords.Contains(x))
            .ToList();

        var result = new List<string>();

        // Ưu tiên cụm 3 từ
        for (int i = 0; i < words.Count - 2; i++)
        {
            result.Add($"{words[i]} {words[i + 1]} {words[i + 2]}");
        }

        // Ưu tiên cụm 2 từ
        for (int i = 0; i < words.Count - 1; i++)
        {
            result.Add($"{words[i]} {words[i + 1]}");
        }

        // Chỉ giữ keyword đơn nếu không mơ hồ
        foreach (var word in words)
        {
            if (!ambiguousWords.Contains(word))
            {
                result.Add(word);
            }
        }

        return result
            .Distinct()
            .ToList();
    }
}