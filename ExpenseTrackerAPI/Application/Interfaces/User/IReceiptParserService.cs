using ExpenseTrackerAPI.Application.DTOs.Ocr;

namespace ExpenseTrackerAPI.Application.Interfaces.User;

public interface IReceiptParserService
{
    ParsedReceiptDto Parse(OcrResponseDto ocr);
}
