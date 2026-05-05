using DocumentFormat.OpenXml.Vml;
using ExpenseTrackerAPI.Application.DTOs.Ocr;
using ExpenseTrackerAPI.Application.Interfaces.User;
using System.Globalization;
using System.Text.RegularExpressions;

namespace ExpenseTrackerAPI.Services.User;

public class ReceiptParserService : IReceiptParserService
{
    /// <summary>
    /// Hàm chính
    /// 1. Lấy rawText+ lines
    /// 2. Gọi từng hàm xác định merchant, date, total, vat, items
    /// 3.. Tính confidence
    /// </summary>
    /// <param name="ocr"></param> input từ OCR
    /// <returns></returns> 
    public ParsedReceiptDto Parse(OcrResponseDto ocr)
    {
        var rawText = ocr.Raw_Text ?? "";
        var lines = ocr.Lines.Select(x => x.Text).Where(x => !string.IsNullOrWhiteSpace(x)).ToList();

        var result = new ParsedReceiptDto
        {
            Success = true,
            RawText = rawText,
            OcrConfidence = ocr.Avg_Confidence,
            Currency = "VND"
        };

        result.Merchant = ExtractMerchant(lines);
        result.TransactionDate = ExtractDate(rawText);
        result.TotalAmount = ExtractTotalAmount(lines, rawText);
        result.VatAmount = ExtractVatAmount(lines, rawText);
        result.Subtotal = ExtractSubtotal(lines, rawText);
        result.Items = ExtractItems(lines);

        result.ParseConfidence = CalculateConfidence(result);

        return result;
    }
    #region Extract các loại trong hoá đơn
    /// <summary>
    /// Xác định tên đơn vị bán hàng
    /// </summary>
    /// <param name="lines"></param>
    /// <returns></returns>
    private string? ExtractMerchant(List<string> lines)
    {
        var sellerLine = lines.FirstOrDefault(x =>
            Normalize(x).Contains("congty") ||
            Normalize(x).Contains("cong ty") ||
            Normalize(x).Contains("winmart") ||
            Normalize(x).Contains("circle") ||
            Normalize(x).Contains("bach hoa") ||
            Normalize(x).Contains("cua hang")||
            Normalize(x).Contains("coop") ||
            Normalize(x).Contains("lotte"));

        if (sellerLine == null)
            return lines.FirstOrDefault();

        sellerLine = sellerLine
            .Replace("Don banhang", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Don v ban hang", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Don vi ban hang", "", StringComparison.OrdinalIgnoreCase)
            .Trim();

        return sellerLine;
    }

    /// <summary>
    /// Xác định ngày hoá đơn
    /// </summary>
    /// <param name="rawText"></param>
    /// <returns></returns>
    private DateTime? ExtractDate(string rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText))
            return null;

        rawText = rawText.Replace("\n", " ").Trim();

        var patterns = new[]
        {
        // dd/MM/yyyy HH:mm:ss hoặc dd/MM/yyyy-HH:mm
        @"(?<day>\d{1,2})[\/\-\.](?<month>\d{1,2})[\/\-\.](?<year>\d{4})[\s\-T]?(?<hour>\d{1,2}):(?<minute>\d{2})(?::(?<second>\d{2}))?",

        // yyyy-MM-dd HH:mm:ss
        @"(?<year>\d{4})[\/\-\.](?<month>\d{1,2})[\/\-\.](?<day>\d{1,2})[\s\-T]?(?<hour>\d{1,2}):(?<minute>\d{2})(?::(?<second>\d{2}))?",

        // dd/MM/yyyy
        @"(?<day>\d{1,2})[\/\-\.](?<month>\d{1,2})[\/\-\.](?<year>\d{4})",

        // yyyy-MM-dd
        @"(?<year>\d{4})[\/\-\.](?<month>\d{1,2})[\/\-\.](?<day>\d{1,2})"
    };

        foreach (var pattern in patterns)
        {
            var match = Regex.Match(rawText, pattern);
            if (!match.Success) continue;

            try
            {
                int year = int.Parse(match.Groups["year"].Value);
                int month = int.Parse(match.Groups["month"].Value);
                int day = int.Parse(match.Groups["day"].Value);

                int hour = match.Groups["hour"].Success ? int.Parse(match.Groups["hour"].Value) : 0;
                int minute = match.Groups["minute"].Success ? int.Parse(match.Groups["minute"].Value) : 0;
                int second = match.Groups["second"].Success ? int.Parse(match.Groups["second"].Value) : 0;

                return new DateTime(year, month, day, hour, minute, second);
            }
            catch
            {
                continue; // ❗ KHÔNG return null ngay → thử pattern khác
            }
        }

        return null;
    }


    /// <summary>
    /// Xác định tổng tiền dựa vào keyword
    /// </summary>
    /// <param name="lines"></param>
    /// <param name="rawText"></param>
    /// <returns></returns>
    private decimal? ExtractTotalAmount(List<string> lines, string rawText)
    {
        var keywords = new[]
        {
            "tong tien thanh toan",
            "tong ten thanh toan",
            "tong tien",
            "tong cong",
            "thanh toan",
            "total",
            "amount"
        };

        return ExtractAmountNearKeywords(lines, keywords) ?? ExtractBestAmount(lines);
    }

    /// <summary>
    /// Xác định phí VAT
    /// </summary>
    /// <param name="lines"></param>
    /// <param name="rawText"></param>
    /// <returns></returns>
    private decimal? ExtractVatAmount(List<string> lines, string rawText)
    {
        var keywords = new[]
        {
            "tien thue",
            "thue gtgt",
            "vat"
        };

        return ExtractAmountNearKeywords(lines, keywords);
    }

    /// <summary>
    /// Tiền trước thuế
    /// </summary>
    /// <param name="lines"></param>
    /// <param name="rawText"></param>
    /// <returns></returns>
    private decimal? ExtractSubtotal(List<string> lines, string rawText)
    {
        var keywords = new[]
        {
            "cong tien hang",
            "tien hang",
            "subtotal",
            "tam tinh"
        };

        return ExtractAmountNearKeywords(lines, keywords);
    }

    /// <summary>
    /// Extract all tiền hợp lệ từ text
    /// </summary>
    /// <param name="text"></param>
    /// <returns></returns>
    private List<decimal> ExtractAmounts(string text)
    {
        if (IsPhoneNumber(text)) return new List<decimal>();
        var matches = Regex.Matches(text, @"\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+");

        if (!IsLikelyMoneyContext(text))
            return new List<decimal>();

        return matches
            .Select(m => ParseMoney(m.Value))
            .Where(x => x.HasValue && x.Value >= 1000)
            .Select(x => x!.Value)
            .ToList();
    }

    /// <summary>
    /// Trích xuất danh sách sản phẩm
    /// </summary>
    /// <param name="lines"></param>
    /// <returns></returns>
    private List<ParsedReceiptItemDto> ExtractItems(List<string> lines)
    {
        var items = new List<ParsedReceiptItemDto>();

        for (int i = 0; i < lines.Count; i++)
        {
            var nameLine = lines[i];
            var norm = Normalize(nameLine);

            // STOP khi tới phần tổng kết
            if (norm.Contains("tong") || norm.Contains("khachphai"))
                break;
            if (!HasProductLikeText(nameLine) || IsNonItemLine(nameLine))
                continue;

            // tìm các dòng phía sau có số
            var nextNumbers = new List<decimal>();

            for (int j = i + 1; j < Math.Min(i + 6, lines.Count); j++)
            {
                var amounts = ExtractAmounts(lines[j]);
                if (amounts.Any())
                    nextNumbers.AddRange(amounts);

                if (nextNumbers.Count >= 2) break;
            }

            if (nextNumbers.Count >= 1)
            {
                items.Add(new ParsedReceiptItemDto
                {
                    Name = CleanItemName(nameLine),
                    UnitPrice = nextNumbers.Count >= 2 ? nextNumbers[0] : null,
                    Amount = nextNumbers.Last(),
                    Confidence = 0.7
                });

                i += 3; // skip block
            }
        }

        return items;
    }

    #endregion

    #region Helper
    /// <summary>
    /// Số tiền gần keyword
    /// </summary>
    /// <param name="lines"></param>
    /// <param name="keywords"></param>
    /// <returns></returns>
    private decimal? ExtractAmountNearKeywords(List<string> lines, string[] keywords)
    {
        for (int i = 0; i < lines.Count; i++)
        {
            var current = Normalize(lines[i]);

            if (!keywords.Any(k => current.Contains(k)))
                continue;

            var sameLineAmount = ExtractAmounts(lines[i]).LastOrDefault();
            if (sameLineAmount > 0)
                return sameLineAmount;

            for (int j = i + 1; j <= Math.Min(i + 3, lines.Count - 1); j++)
            {
                var amount = ExtractAmounts(lines[j]).LastOrDefault();
                if (amount > 0)
                    return amount;
            }
        }

        return null;
    }
    /// <summary>
    /// Fallback khi không tìm được total rõ ràng
    /// gom tất cả số tiền, gán score
    /// chọn theo max score
    /// </summary>
    /// <param name="lines"></param>
    /// <returns></returns>
    private decimal? ExtractBestAmount(List<string> lines)
    {
        var candidates = new List<(decimal amount, double score)>();

        foreach (var line in lines)
        {
            var amounts = ExtractAmounts(line);
            if (!amounts.Any()) continue;

            var norm = Normalize(line);

            double score = 0;

            if (norm.Contains("tong") || norm.Contains("total")) score += 2;
            if (norm.Contains("thanh toan")) score += 2;
            if (norm.Contains("tien")) score += 1;

            int index = lines.IndexOf(line);
            if (index >= lines.Count - 3) score += 1.5;

            foreach (var amt in amounts)
            {
                candidates.Add((amt, score));
            }
        }

        if (!candidates.Any()) return null;

        return candidates
            .OrderByDescending(x => x.score)
            .ThenByDescending(x => x.amount)
            .First().amount;
    }

    /// <summary>
    /// Convert string => decimal
    /// </summary>
    /// <param name="value"></param>
    /// <returns></returns>
    private decimal? ParseMoney(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var cleaned = value.Trim();

        if (cleaned.Count(c => c == '.' || c == ',') >= 1)
        {
            cleaned = cleaned.Replace(".", "").Replace(",", "");
        }

        if (decimal.TryParse(cleaned, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
            return amount;

        return null;
    }
    #endregion
    #region Check
    /// <summary>
    /// Kiểm tra xem có chứa các từ trong blacklist keyword không
    /// </summary>
    /// <param name="text"></param>
    /// <returns></returns>
    private bool IsNonItemLine(string text)
    {
        var norm = Normalize(text);

        return NonItemKeywords.Any(k => norm.Contains(k));
    }

    /// <summary>
    /// check xem có sđt không
    /// </summary>
    /// <param name="text"></param>
    /// <returns></returns>
    private bool IsPhoneNumber(string text)
    {
        var cleaned = Regex.Replace(text, @"\D", "");

        if (cleaned.StartsWith("84"))
            return cleaned.Length >= 11 && cleaned.Length <= 12;

        return cleaned.Length >= 9 && cleaned.Length <= 10;
    }
    /// <summary>
    /// Check có phải số lượng k
    /// </summary>
    /// <param name="value"></param>
    /// <returns></returns>
    private bool IsLikelyQuantity(decimal value)
    {
        return value < 100; // thường quantity nhỏ
    }
    /// <summary>
    /// Check có phải tiền không (tránh nhầm với id, phone, mã hoá đơn)
    /// </summary>
    /// <param name="text"></param>
    /// <returns></returns>
    private bool IsLikelyMoneyContext(string text)
    {
        var norm = Normalize(text);

        return norm.Contains("tien") ||
               norm.Contains("gia") ||
               norm.Contains("total") ||
               norm.Contains("tong") ||
               text.Contains("đ") ||
               text.Contains("vnd") ||
               text.Contains(",") ||
               text.Contains(".");
    }
    /// <summary>
    /// Check xem có phải tên sản phẩm k
    /// </summary>
    /// <param name="text"></param>
    /// <returns></returns>
    private bool HasProductLikeText(string text)
    {
        var norm = Normalize(text);

        if (norm.Length < 3) return false;

        return Regex.IsMatch(norm, @"[a-zA-Z]");
    }

    /// <summary>
    /// Xoá số khỏi tên sản phẩm
    /// </summary>
    /// <param name="text"></param>
    /// <returns></returns>
    private string CleanItemName(string text)
    {
        return Regex.Replace(text, @"\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+", "")
            .Trim('-', ':', ' ', '.', ',');
    }
    #endregion

    /// <summary>
    /// Tính độ tin cậy
    /// </summary>
    /// <param name="result"></param>
    /// <returns></returns>
    private double CalculateConfidence(ParsedReceiptDto result)
    {
        double score = 0.3;

        if (!string.IsNullOrWhiteSpace(result.Merchant)) score += 0.15;
        if (result.TransactionDate != null) score += 0.15;
        if (result.Items.Any()) score += 0.15;
        if (result.TotalAmount != null && result.TotalAmount > 0)
            score += 0.3;

        if (result.Items.Count >= 2)
            score += 0.2;

        return Math.Min(score, 1.0);
    }

    /// <summary>
    /// Remove dấu tiếng việt
    /// </summary>
    /// <param name="text"></param>
    /// <returns></returns>
    private string Normalize(string text)
    {
        return text
            .ToLowerInvariant()
            .Replace("đ", "d")
            .Replace("á", "a")
            .Replace("à", "a")
            .Replace("ả", "a")
            .Replace("ã", "a")
            .Replace("ạ", "a")
            .Replace("ă", "a")
            .Replace("ắ", "a")
            .Replace("ằ", "a")
            .Replace("ẳ", "a")
            .Replace("ẵ", "a")
            .Replace("ặ", "a")
            .Replace("â", "a")
            .Replace("ấ", "a")
            .Replace("ầ", "a")
            .Replace("ẩ", "a")
            .Replace("ẫ", "a")
            .Replace("ậ", "a")
            .Replace("é", "e")
            .Replace("è", "e")
            .Replace("ẻ", "e")
            .Replace("ẽ", "e")
            .Replace("ẹ", "e")
            .Replace("ê", "e")
            .Replace("ế", "e")
            .Replace("ề", "e")
            .Replace("ể", "e")
            .Replace("ễ", "e")
            .Replace("ệ", "e")
            .Replace("í", "i")
            .Replace("ì", "i")
            .Replace("ỉ", "i")
            .Replace("ĩ", "i")
            .Replace("ị", "i")
            .Replace("ó", "o")
            .Replace("ò", "o")
            .Replace("ỏ", "o")
            .Replace("õ", "o")
            .Replace("ọ", "o")
            .Replace("ô", "o")
            .Replace("ố", "o")
            .Replace("ồ", "o")
            .Replace("ổ", "o")
            .Replace("ỗ", "o")
            .Replace("ộ", "o")
            .Replace("ơ", "o")
            .Replace("ớ", "o")
            .Replace("ờ", "o")
            .Replace("ở", "o")
            .Replace("ỡ", "o")
            .Replace("ợ", "o")
            .Replace("ú", "u")
            .Replace("ù", "u")
            .Replace("ủ", "u")
            .Replace("ũ", "u")
            .Replace("ụ", "u")
            .Replace("ư", "u")
            .Replace("ứ", "u")
            .Replace("ừ", "u")
            .Replace("ử", "u")
            .Replace("ữ", "u")
            .Replace("ự", "u")
            .Replace("ý", "y")
            .Replace("ỳ", "y")
            .Replace("ỷ", "y")
            .Replace("ỹ", "y")
            .Replace("ỵ", "y");
    }

    /// <summary>
    /// Keyword để biết không phải item
    /// </summary>
    private static readonly string[] NonItemKeywords =
    {
        "tong", "tien", "thue", "vat", "cong",
        "chiet khau", "giam gia", "phi",
        "khach", "tra", "dua",
        "tien mat", "chuyen khoan",
        "so luong", "tang",
        "ma", "hoa don", "ngay",
        "ttien", "t.tien"
    };

}