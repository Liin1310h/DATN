using System.Text.RegularExpressions;
using ExpenseTrackerAPI.Application.Interfaces.AI;
using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class PersonalCategoryRuleService : IPersonalCategoryRuleService
{
    private readonly AppDbContext _context;

    public PersonalCategoryRuleService(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Học từ giao dịch thực tế của user để tạo ra các rule cá nhân
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="note"></param>
    /// <param name="type"></param>
    /// <param name="categoryId"></param>
    /// <returns></returns>
    public async Task LearnAsync(int userId, string? note, string type, int? categoryId)
    {
        if (categoryId == null) return;
        if (string.IsNullOrWhiteSpace(note)) return;

        type = type.Trim().ToLower();

        if (type != "expense" && type != "income") return;

        var keywords = ExtractKeywords(note);

        foreach (var keyword in keywords)
        {
            var rule = await _context.PersonalCategoryRules
                .FirstOrDefaultAsync(x =>
                    x.UserId == userId &&
                    x.Type == type &&
                    x.Keyword == keyword &&
                    x.CategoryId == categoryId.Value);

            if (rule == null)
            {
                _context.PersonalCategoryRules.Add(new PersonalCategoryRule
                {
                    UserId = userId,
                    Type = type,
                    Keyword = keyword,
                    CategoryId = categoryId.Value,
                    Count = 1,
                    LastUsedAt = DateTime.UtcNow
                });
            }
            else
            {
                rule.Count += 1;
                rule.LastUsedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Hủy học từ giao dịch khi user chỉnh sửa/sửa giao dịch đó
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="note"></param>
    /// <param name="type"></param>
    /// <param name="categoryId"></param>
    /// <returns></returns>
    public async Task UnlearnAsync(int userId, string? note, string type, int? categoryId)
    {
        if (categoryId == null) return;
        if (string.IsNullOrWhiteSpace(note)) return;

        type = type.Trim().ToLower();

        if (type != "expense" && type != "income") return;

        var keywords = ExtractKeywords(note);

        if (keywords.Count == 0) return;

        var rules = await _context.PersonalCategoryRules
            .Where(x =>
                x.UserId == userId &&
                x.Type == type &&
                x.CategoryId == categoryId.Value &&
                keywords.Contains(x.Keyword))
            .ToListAsync();

        foreach (var rule in rules)
        {
            rule.Count -= 1;

            if (rule.Count <= 0)
            {
                _context.PersonalCategoryRules.Remove(rule);
            }
        }

        await _context.SaveChangesAsync();
    }

    private static List<string> ExtractKeywords(string note)
    {
        var stopWords = new HashSet<string>
    {
        "cho", "cua", "của", "va", "và", "voi", "với",
        "mua", "tra", "trả", "thanh", "toan", "toán",
        "chuyen", "chuyển", "khoan", "khoản",
        "tien", "tiền", "phi", "phí",
        "don", "đơn", "hang", "hàng",
        "online", "ck", "bill",
        "ngay", "ngày", "hom", "hôm", "nay",
        "bang", "bằng", "qua"
    };

        note = note.Trim().ToLowerInvariant();

        // Bỏ dấu câu, ký tự đặc biệt nhưng vẫn giữ chữ tiếng Việt và số
        note = Regex.Replace(note, @"[^\p{L}\p{N}\s]", " ");

        var words = note
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim())
            .Where(x => x.Length >= 2)
            .Where(x => !stopWords.Contains(x))
            .ToList();

        var keywords = new List<string>();

        // Ưu tiên cụm 3 từ
        for (int i = 0; i < words.Count - 2; i++)
        {
            keywords.Add($"{words[i]} {words[i + 1]} {words[i + 2]}");
        }

        // Cụm 2 từ
        for (int i = 0; i < words.Count - 1; i++)
        {
            keywords.Add($"{words[i]} {words[i + 1]}");
        }

        // Từ đơn
        keywords.AddRange(words);

        return keywords
            .Distinct()
            .Take(10)
            .ToList();
    }
}