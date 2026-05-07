using ExpenseTrackerAPI.Application.DTOs.AI;
using ExpenseTrackerAPI.Application.DTOs.Ocr;
using ExpenseTrackerAPI.Application.Interfaces.AI;

namespace ExpenseTrackerAPI.Application.Services.AI
{
    public class AIReceiptParser : IAIReceiptParser
    {
        private readonly HttpClient _http;

        public AIReceiptParser(HttpClient http)
        {
            _http = http;
        }

        public async Task<ParsedReceiptDto?> ParseAsync(string rawText)
        {
            var prompt = BuildPrompt(rawText);

            var request = new
            {
                model = "gpt-4.1-mini",
                messages = new[]
                {
                new { role = "user", content = prompt }
            },
                temperature = 0
            };

            var response = await _http.PostAsJsonAsync(
                "v1/chat/completions",
                request
            );

            var json = await response.Content.ReadAsStringAsync();

            // parse response → ParsedReceiptDto
            return ParseJson(json);
        }

        private ParsedReceiptDto? ParseJson(string json)
        {
            try
            {
                // Map JSON => object
                var openAiResponse = System.Text.Json.JsonSerializer.Deserialize<OpenAIResponse>(json);
                // Lấy nội dung
                var content = openAiResponse?
                    .Choices?
                    .FirstOrDefault()?
                    .Message?
                    .Content;

                if (string.IsNullOrWhiteSpace(content))
                    return null;

                // parse JSON do AI trả về
                var aiData = System.Text.Json.JsonSerializer.Deserialize<AIReceiptDto>(content);

                if (aiData == null) return null;

                return new ParsedReceiptDto
                {
                    Merchant = aiData.merchant,
                    TransactionDate = ParseDate(aiData.date),
                    TotalAmount = aiData.total,
                    VatAmount = aiData.vat,
                    Items = aiData.items?.Select(x => new ParsedReceiptItemDto
                    {
                        Name = x.name,
                        Amount = x.amount
                    }).ToList() ?? new(),
                    Success = true,
                    Currency = "VND",
                    ParseConfidence = 0.85 // AI mặc định cao hơn rule
                };
            }
            catch
            {
                return null;
            }
        }
        private DateTime? ParseDate(string? date)
        {
            if (DateTime.TryParse(date, out var result))
                return result;

            return null;
        }

        /// <summary>
        /// Hàm xây prompt gửi lên AI
        /// </summary>
        /// <param name="rawText"></param>
        /// <returns></returns>
        private string BuildPrompt(string rawText)
        {
            return $@"You are an AI that extracts structured data from Vietnamese receipts.

                    Return ONLY valid JSON.

                    Schema:
                    {{
                      ""merchant"": string | null,
                      ""date"": string | null,
                      ""total"": number | null,
                      ""vat"": number | null,
                      ""items"": [{{ ""name"": string, ""amount"": number }}]
                    }}

                    Receipt:
                    {rawText}";
        }
    }

}
