using ExpenseTrackerAPI.Application.DTOs.Ocr;

namespace ExpenseTrackerAPI.Application.Interfaces.AI
{
    public interface IAIReceiptParser
    {
        Task<ParsedReceiptDto?> ParseAsync(string rawText);
    }
}
