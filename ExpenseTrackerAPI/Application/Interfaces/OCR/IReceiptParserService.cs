using ExpenseTrackerAPI.Application.DTOs.Ocr;

namespace ExpenseTrackerAPI.Application.Interfaces.OCR;

public interface IReceiptParserService
{
    ParsedReceiptDto Parse(OcrResponseDto ocr);
}
