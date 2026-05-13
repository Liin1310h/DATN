// Application/Services/OCR/ReceiptTransactionFlowService.cs

using ExpenseTrackerAPI.Application.DTOs.Ocr;
using ExpenseTrackerAPI.Application.Interfaces.OCR;
using ExpenseTrackerAPI.Infrastructure.Data;
using ExpenseTrackerAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using ExpenseTrackerAPI.API.Hubs;
using Hangfire;

namespace ExpenseTrackerAPI.Application.Services.OCR;

public class ReceiptTransactionFlowService : IReceiptTransactionFlowService
{
    private readonly IOcrService _ocrService;
    private readonly IReceiptProcessingService _receiptProcessingService;
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    public ReceiptTransactionFlowService(
        IOcrService ocrService,
        IReceiptProcessingService receiptProcessingService,
        AppDbContext context, IHubContext<NotificationHub> hubContext)
    {
        _ocrService = ocrService;
        _receiptProcessingService = receiptProcessingService;
        _context = context;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Preview (enqueue job)
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="file"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async Task<ReceiptPreviewJobResponseDto> PreviewAsync(int userId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new Exception("File không hợp lệ");

        // lưu file tạm
        var filePath = await SaveTempFile(file);

        var jobId = Guid.NewGuid().ToString();

        // lưu trạng thái processing
        _context.Add(new ReceiptJobResult
        {
            JobId = jobId,
            UserId = userId,
            Status = "processing"
        });
        await _context.SaveChangesAsync();

        // enqueue job
        BackgroundJob.Enqueue<IReceiptTransactionFlowService>(x =>
            x.ProcessReceiptJob(userId, filePath, jobId)
        );

        return new ReceiptPreviewJobResponseDto
        {
            Success = true,
            JobId = jobId,
            Message = "Đã gửi OCR xử lý"
        };
    }

    /// <summary>
    /// Lấy kết quả (polling)
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="jobId"></param>
    /// <returns></returns>
    public async Task<ReceiptTransactionPreviewResponseDto?> GetResultAsync(int userId, string jobId)
    {
        var job = await _context.Set<ReceiptJobResult>()
            .FirstOrDefaultAsync(x => x.JobId == jobId && x.UserId == userId);

        if (job == null) return null;

        return new ReceiptTransactionPreviewResponseDto
        {
            Success = job.Status == "done",
            Status = job.Status,
            JobId = jobId,
            Error = job.Error,
            Data = job.Data
        };
    }
    /// <summary>
    /// Background job
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="filePath"></param>
    /// <param name="jobId"></param>
    /// <returns></returns>
    public async Task ProcessReceiptJob(int userId, string filePath, string jobId)
    {
        try
        {
            // đọc file
            var bytes = await File.ReadAllBytesAsync(filePath);
            var formFile = ConvertToFormFile(bytes);

            // OCR
            var ocrResult = await _ocrService.ExtractAsync(formFile);
            if (ocrResult == null)
                throw new Exception("OCR returned empty result");
            // parse
            var parsed = await _receiptProcessingService.ProcessAsync(userId, ocrResult);
            if (parsed.Items == null || !parsed.Items.Any())
            {
                throw new Exception("Parsed result contains no items list.");
            }
            var previews = parsed.Items.Select(item => new ReceiptTransactionPreviewDto
            {
                TempId = Guid.NewGuid().ToString(),
                Selected = true,
                Type = "expense",
                Amount = item.Amount ?? 0,
                Currency = parsed.Currency ?? "VND",
                TransactionDate = parsed.TransactionDate ?? DateTime.UtcNow,
                Note = BuildTransactionNote(parsed.Merchant, item.Name),
                CategoryId = item.CategoryId,
                CategoryName = item.CategoryName,
                CategoryConfidence = item.CategoryConfidence,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Merchant = parsed.Merchant
            })
            .Where(x => x.Amount > 0)
            .ToList();

            if (!previews.Any())
            {
                throw new Exception("Không tìm thấy giao dịch hợp lệ từ hóa đơn.");
            }

            var data = new ReceiptTransactionPreviewDataDto
            {
                Merchant = parsed.Merchant,
                TransactionDate = parsed.TransactionDate?.ToUniversalTime(),
                TotalAmount = parsed.TotalAmount,
                Currency = parsed.Currency ?? "VND",
                RawText = parsed.RawText,
                OcrConfidence = parsed.OcrConfidence,
                ParseConfidence = parsed.ParseConfidence,
                Transactions = previews
            };

            var job = await _context.Set<ReceiptJobResult>()
                .FirstOrDefaultAsync(x => x.JobId == jobId);
            if (job != null)
            {
                job.Status = "done";
                job.Data = data;
                job.Error = null;
            }

            await _context.SaveChangesAsync();

            // push realtime
            await _hubContext.Clients.User(userId.ToString())
                .SendAsync("OCR_DONE", new
                {
                    jobId,
                    data
                });
        }
        catch (Exception ex)
        {
            var job = await _context.Set<ReceiptJobResult>()
                .FirstOrDefaultAsync(x => x.JobId == jobId);

            if (job != null)
            {
                job.Status = "failed";
                job.Error = ex.ToString();
            }

            await _context.SaveChangesAsync();

            await _hubContext.Clients.User(userId.ToString())
                .SendAsync("OCR_FAILED", new
                {
                    jobId,
                    error = ex.Message,
                    message = "Quá trình OCR hoặc phân loại giao dịch bị lỗi"
                });
        }
        finally
        {
            if (File.Exists(filePath))
                File.Delete(filePath);
        }
    }

    #region Helper
    private async Task<string> SaveTempFile(IFormFile file)
    {
        var folder = Path.Combine(Path.GetTempPath(), "receipts");
        Directory.CreateDirectory(folder);

        var filePath = Path.Combine(folder, Guid.NewGuid() + ".jpg");

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return filePath;
    }

    private IFormFile ConvertToFormFile(byte[] bytes)
    {
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", "receipt.jpg")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/jpeg"
        };
    }
    private string BuildTransactionNote(string? merchant, string itemName)
    {
        if (string.IsNullOrWhiteSpace(merchant))
            return itemName;

        return $"{merchant} - {itemName}";
    }
    #endregion
    /// <summary>
    /// Tạo transaction (user confirm)
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="request"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async Task<List<object>> CreateTransactionsAsync(
        int userId,
        CreateTransactionsFromReceiptRequest request)
    {
        var selected = request.Transactions
            .Where(x => x.Selected)
            .ToList();

        if (!selected.Any())
            throw new Exception("Bạn chưa chọn transaction nào");

        var entities = selected.Select(item =>
        {
            var accountId = item.FromAccountId ?? request.DefaultAccountId;

            if (accountId <= 0)
                throw new Exception("Tài khoản không hợp lệ");

            if (item.Amount <= 0)
                throw new Exception("Số tiền không hợp lệ");

            return new Transaction
            {
                UserId = userId,
                Amount = item.Amount,
                Currency = item.Currency,
                Type = item.Type,
                TransactionDate = DateTime.SpecifyKind(
                    item.TransactionDate,
                    DateTimeKind.Utc
                ),
                Note = item.Note,
                CategoryId = item.CategoryId,
                FromAccountId = accountId
            };
        }).ToList();

        await _context.Transactions.AddRangeAsync(entities);
        await _context.SaveChangesAsync();

        return entities.Select(x => new
        {
            x.Id,
            x.Amount,
            x.Currency,
            x.Type,
            x.TransactionDate,
            x.Note,
            x.CategoryId,
            x.FromAccountId
        }).Cast<object>().ToList();
    }

}