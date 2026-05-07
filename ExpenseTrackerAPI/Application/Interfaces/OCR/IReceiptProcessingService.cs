using ExpenseTrackerAPI.Application.DTOs.Ocr;

namespace ExpenseTrackerAPI.Application.Interfaces.OCR
{
    public interface IReceiptProcessingService
    {
        Task<ParsedReceiptDto> ProcessAsync(int userId, OcrResponseDto ocr);
    }
}
