using ExpenseTrackerAPI.Application.DTOs.AI;
using ExpenseTrackerAPI.Application.DTOs.Ocr;
using ExpenseTrackerAPI.Application.Interfaces.AI;
using ExpenseTrackerAPI.Application.Interfaces.User;
using Microsoft.AspNetCore.Rewrite;

namespace ExpenseTrackerAPI.Application.Services.Users
{
    public class ReceiptProcessingService : IReceiptProcessingService
    {
        private readonly IReceiptParserService _ruleParser;
        private readonly IAIReceiptParser _aiParser;
        private readonly ICategoryPredictionService _categoryService;

        public ReceiptProcessingService(IReceiptParserService ruleParser, IAIReceiptParser aiParser, ICategoryPredictionService categoryService)
        {
            _ruleParser = ruleParser;
            _aiParser = aiParser;
            _categoryService = categoryService;
        }

        public async Task<ParsedReceiptDto> ProcessAsync(int userId,OcrResponseDto ocr)
        {
            // 1. Rule parse trước
            var ruleResult = _ruleParser.Parse(ocr);

            ParsedReceiptDto finalResult = ruleResult;
            // 2. Nếu confidence thấp → dùng AI
            if (ruleResult.ParseConfidence < 0.7)
            {
                var aiResult = await _aiParser.ParseAsync(ruleResult.RawText);

                if (aiResult != null)
                {
                    finalResult = MergeResult(ruleResult, aiResult);
                }
            }

            // 3. GỌI CATEGORY AI CHO TỪNG ITEM
            if (finalResult.Items != null && finalResult.Items.Any())
            {
                foreach (var item in finalResult.Items)
                {
                    var predict = await _categoryService.PredictAsync(userId, new()
                    {
                        Note = item.Name,
                        Amount = item.Amount ??0,
                        Type = "expense"
                    });

                    item.CategoryId = predict.CategoryId;
                    item.CategoryName = predict.CategoryName;
                    item.CategoryConfidence = predict.Confidence;
                }
            }

            return finalResult;
        }
        
        /// <summary>
        /// Merge kết quả rule + AI
        /// </summary>
        /// <param name="rule"></param>
        /// <param name="ai"></param>
        /// <returns></returns>
        private ParsedReceiptDto MergeResult(ParsedReceiptDto rule, ParsedReceiptDto ai)
        {
            return new ParsedReceiptDto
            {
                Merchant = ai.Merchant ?? rule.Merchant,
                TransactionDate = ai.TransactionDate ?? rule.TransactionDate,
                TotalAmount = ai.TotalAmount ?? rule.TotalAmount,
                VatAmount = ai.VatAmount ?? rule.VatAmount,
                Subtotal = ai.Subtotal ?? rule.Subtotal,
                Items = ai.Items.Any() ? ai.Items : rule.Items,
                RawText = rule.RawText,
                OcrConfidence = rule.OcrConfidence,
                ParseConfidence = Math.Max(rule.ParseConfidence, 0.85)
            };
        }
    }

}
