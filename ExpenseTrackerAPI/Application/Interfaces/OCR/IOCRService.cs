using ExpenseTrackerAPI.Application.DTOs.Ocr;

namespace ExpenseTrackerAPI.Application.Interfaces.OCR;

public interface IOcrService
{
    Task<OcrResponseDto> ExtractAsync(IFormFile file);
}
