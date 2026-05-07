// Application/Interfaces/OCR/IReceiptTransactionFlowService.cs

using ExpenseTrackerAPI.Application.DTOs.Ocr;

namespace ExpenseTrackerAPI.Application.Interfaces.OCR;

public interface IReceiptTransactionFlowService
{
    Task<ReceiptPreviewJobResponseDto> PreviewAsync(int userId, IFormFile file);
    Task<ReceiptTransactionPreviewResponseDto?> GetResultAsync(int userId, string jobId);
    Task ProcessReceiptJob(int userId, string filePath, string jobId);

    Task<List<object>> CreateTransactionsAsync(
        int userId,
        CreateTransactionsFromReceiptRequest request
    );
}