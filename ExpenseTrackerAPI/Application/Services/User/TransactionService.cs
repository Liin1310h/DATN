using ExpenseTrackerAPI.Infrastructure.Data;
using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Application.DTOs;
using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Application.Interfaces.User;
using ExpenseTrackerAPI.Application.Interfaces.AI;
using ClosedXML.Excel;

namespace ExpenseTrackerAPI.Application.Services;

public class TransactionService : ITransactionService
{
    private readonly AppDbContext _context;
    private readonly ICurrencyService _currencyService;
    private readonly IPersonalCategoryRuleService _personalCategoryRuleService;
    public TransactionService(AppDbContext context, ICurrencyService currencyService, IPersonalCategoryRuleService personalCategoryRuleService)
    {
        _context = context;
        _currencyService = currencyService;
        _personalCategoryRuleService = personalCategoryRuleService;
    }

    //Helper
    private static bool IsExpenseLike(string type) => type is "expense";
    private static bool IsIncomeLike(string type) => type is "income";

    private static string NormalizeType(string type) => type?.Trim().ToLower() ?? string.Empty;

    /// <summary>
    /// !Hàm check xem transaction có phải kiểu expense hoặc income không
    /// </summary>
    /// <param name="type"></param>
    /// <exception cref="Exception"></exception>
    private static void EnsureNormalTransactionType(string type)
    {
        var normalized = NormalizeType(type);
        if (normalized is not ("income" or "expense"))
            throw new Exception("TransactionService chỉ hỗ trợ income hoặc expense");

    }

    /// <summary>
    /// !Check xem tài khoản có hợp lệ không
    /// (phải tồn tại và phải của user)
    /// </summary>
    /// <param name="accountId"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    private async Task<Account> GetOwnedAccountAsync(int accountId, int userId)
    {
        var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

        if (account == null)
            throw new Exception("Tài khoản không tồn tại hoặc không thuộc quyền sở hữu của bạn!");
        return account;
    }

    /// <summary>
    /// !Hàm chuyển tiền tệ
    /// </summary>
    /// <param name="amount"></param>
    /// <param name="fromCurrency"></param>
    /// <param name="toCurrency"></param>
    /// <returns></returns>
    private async Task<decimal> ConvertIdNeededAsync(decimal amount, string fromCurrency, string toCurrency)
    {
        if (string.Equals(fromCurrency, toCurrency, StringComparison.OrdinalIgnoreCase)) return amount;

        return await _currencyService.ConvertAsync(amount, fromCurrency, toCurrency);
    }

    /// <summary>
    /// TODO Hàm tạo giao dịch
    /// </summary>
    /// <param name="request"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<Transaction> CreateTransactionAsync(TransactionRequest request, int userId)
    {
        //Đảm bảo kiểu của trans hợp lệ
        EnsureNormalTransactionType(request.Type);

        // Bắt đầu giao dịch
        using var dbTrans = await _context.Database.BeginTransactionAsync();
        try
        {
            var type = NormalizeType(request.Type);
            var account = await GetOwnedAccountAsync(request.AccountId, userId);

            if (request.Amount <= 0)
                throw new Exception("Số tiền phải lớn hơn 0.");
            var appliedAmount = await ConvertIdNeededAsync(request.Amount, request.Currency, account.Currency);

            decimal balanceBefore = account.Balance;

            if (IsExpenseLike(request.Type))
            {
                if (account.Balance < appliedAmount) throw new Exception("Số dư không đủ.");
                account.Balance -= appliedAmount;
            }
            else
            {
                account.Balance += appliedAmount;
            }

            var transaction = new Transaction
            {
                UserId = userId,
                Type = type,
                Amount = request.Amount,
                Currency = request.Currency,
                ConvertedCurrency = request.Currency == account.Currency ? null : account.Currency,
                ConvertedAmount = request.Currency == account.Currency ? null : appliedAmount,

                FromAccountId = IsExpenseLike(request.Type) ? account.Id : null,
                ToAccountId = IsIncomeLike(request.Type) ? account.Id : null,

                CategoryId = request.CategoryId,
                LoanId = request.LoanId,
                Note = request.Note ?? "",

                TransactionDate = request.TransactionDate ?? DateTime.UtcNow,
                BalanceBefore = balanceBefore,
                BalanceAfter = account.Balance
            };

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            // Lưu ảnh hóa đơn nếu có
            if (request.ImageUrls != null && request.ImageUrls.Count > 0)
            {
                var images = request.ImageUrls.Select(url => new TransactionImage
                {
                    TransactionId = transaction.Id,
                    ImageUrl = url,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _context.TransactionImages.AddRange(images);
                await _context.SaveChangesAsync();
            }

            await _personalCategoryRuleService.LearnAsync(userId, transaction.Note, transaction.Type, transaction.CategoryId);
            await dbTrans.CommitAsync();

            return transaction;
        }
        catch { await dbTrans.RollbackAsync(); throw; }
    }

    /// <summary>
    /// TODO Hàm cập nhật transaction
    /// </summary>
    /// <param name="id"></param>
    /// <param name="request"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<Transaction> UpdateTransactionAsync(int id, TransactionRequest request, int userId)
    {
        EnsureNormalTransactionType(request.Type);
        using var dbTrans = await _context.Database.BeginTransactionAsync();
        try
        {
            var type = NormalizeType(request.Type);

            var transaction = await _context.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (transaction == null) throw new Exception("Giao dịch không tồn tại.");

            if (transaction.LoanId != null)
                throw new Exception("Không được cập nhật giao dịch thuộc khoản vay ở TransactionService");

            var oldAccountId = transaction.FromAccountId ?? transaction.ToAccountId;
            if (oldAccountId == null)
                throw new Exception("Transaction không có account hợp lệ.");

            var oldAccount = await GetOwnedAccountAsync(oldAccountId.Value, userId);

            var oldNote = transaction.Note;
            var oldType = transaction.Type;
            var oldCategoryId = transaction.CategoryId;

            // 1. Rollback số dư cũ
            decimal oldAppliedAmount = await ConvertIdNeededAsync(transaction.Amount, transaction.Currency, oldAccount.Currency);

            if (IsExpenseLike(transaction.Type)) oldAccount.Balance += oldAppliedAmount;
            else if (IsIncomeLike(transaction.Type)) oldAccount.Balance -= oldAppliedAmount;
            else throw new Exception("Loại transaction cũ không hợp lệ");


            // 2. Áp dụng số dư mới
            var newAccount = (oldAccountId == request.AccountId) ? oldAccount : await GetOwnedAccountAsync(request.AccountId, userId);

            if (request.Amount <= 0)
                throw new Exception("Số tiền phải lớn hơn 0.");
            decimal newAppliedAmount = await ConvertIdNeededAsync(request.Amount, request.Currency, newAccount.Currency);
            decimal balanceBefore = newAccount.Balance;

            if (IsExpenseLike(request.Type))
            {
                if (newAccount.Balance < newAppliedAmount) throw new Exception("Số dư tài khoản mới không đủ.");
                newAccount.Balance -= newAppliedAmount;
            }
            else newAccount.Balance += newAppliedAmount;

            // 3. Cập nhật Transaction object
            transaction.Type = type;
            transaction.Amount = request.Amount;
            transaction.Currency = request.Currency;
            transaction.ConvertedCurrency = request.Currency == newAccount.Currency ? null : newAccount.Currency;
            transaction.ConvertedAmount =
                request.Currency == newAccount.Currency ? null : newAppliedAmount;

            transaction.FromAccountId = IsExpenseLike(request.Type) ? request.AccountId : null;
            transaction.ToAccountId = IsIncomeLike(request.Type) ? request.AccountId : null;

            transaction.CategoryId = request.CategoryId;
            transaction.Note = request.Note ?? string.Empty;
            transaction.TransactionDate = request.TransactionDate ?? DateTime.UtcNow;

            transaction.BalanceBefore = balanceBefore;
            transaction.BalanceAfter = newAccount.Balance;
            //!  Xoá ảnh cũ thêm ảnh mới
            var oldImages = await _context.TransactionImages
                .Where(i => i.TransactionId == transaction.Id)
                .ToListAsync();
            if (oldImages.Any())
            {
                _context.TransactionImages.RemoveRange(oldImages);
            }

            if (request.ImageUrls != null && request.ImageUrls.Count > 0)
            {
                var newImages = request.ImageUrls.Select(url => new TransactionImage
                {
                    TransactionId = transaction.Id,
                    ImageUrl = url,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _context.TransactionImages.AddRange(newImages);
            }
            await _context.SaveChangesAsync();

            await _personalCategoryRuleService.UnlearnAsync(
                userId,
                oldNote,
                oldType,
                oldCategoryId
            );
            await _personalCategoryRuleService.LearnAsync(
                userId,
                transaction.Note,
                transaction.Type,
                transaction.CategoryId
            );

            await dbTrans.CommitAsync();
            return transaction;
        }
        catch { await dbTrans.RollbackAsync(); throw; }
    }

    /// <summary>
    /// TODO Hàm xoá transaction
    /// </summary>
    /// <param name="id"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task DeleteTransactionAsync(int id, int userId)
    {
        using var dbTrans = await _context.Database.BeginTransactionAsync();
        try
        {
            var transaction = await _context.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (transaction == null) throw new Exception("Không thấy giao dịch.");

            if (transaction.LoanId != null)
                throw new Exception("Không được xoá transaction thuộc khoản vay ở TransactionService");

            var accountId = transaction.FromAccountId ?? transaction.ToAccountId;
            if (accountId == null)
                throw new Exception("Transaction không có account hợp lệ.");

            var account = await _context.Accounts.FirstAsync(a => a.Id == accountId);

            decimal appliedAmount = await ConvertIdNeededAsync(transaction.Amount, transaction.Currency, account.Currency);

            //Hoàn hoặc thu hồi tiền cho tài khoản
            if (IsExpenseLike(transaction.Type)) account.Balance += appliedAmount;
            else if (IsIncomeLike(transaction.Type))
            {
                if (account.Balance < appliedAmount)
                    throw new Exception("Không thể xoá giao dịch vì số dư hiện tại không đủ để rollback");
                account.Balance -= appliedAmount;
            }
            else throw new Exception("Loại transaction không hợp lệ.");

            await _personalCategoryRuleService.UnlearnAsync(
                userId,
                transaction.Note,
                transaction.Type,
                transaction.CategoryId
            );

            var images = await _context.TransactionImages.Where(img => img.TransactionId == transaction.Id).ToListAsync();
            if (images.Any())
            {
                _context.TransactionImages.RemoveRange(images);
            }
            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();
            await dbTrans.CommitAsync();
        }
        catch { await dbTrans.RollbackAsync(); throw; }
    }

    /// <summary>
    /// TODO Chuyển tiền nội bộ giữa 2 tài khoản của user
    /// </summary>
    /// <param name="request"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<Transaction> TransferAsync(TransferRequest request, int userId)
    {
        using var dbTrans = await _context.Database.BeginTransactionAsync();
        try
        {
            if (request.FromAccountId == request.ToAccountId)
                throw new Exception("Tài khoản chuyển và nhận không được trùng nhau.");

            var fromAcc = await GetOwnedAccountAsync(request.FromAccountId, userId);
            var toAcc = await GetOwnedAccountAsync(request.ToAccountId, userId);

            if (request.Amount <= 0)
                throw new Exception("Số tiền chuyển phải lớn hơn 0.");

            if (fromAcc.Balance < request.Amount)
                throw new Exception("Số dư không đủ chuyển.");

            decimal balanceBefore = fromAcc.Balance;
            decimal toAmount = await ConvertIdNeededAsync(request.Amount, fromAcc.Currency, toAcc.Currency);

            fromAcc.Balance -= request.Amount;
            toAcc.Balance += toAmount;

            var trans = new Transaction
            {
                UserId = userId,
                Type = "transfer",
                Amount = request.Amount,
                Currency = fromAcc.Currency,
                ConvertedAmount = fromAcc.Currency == toAcc.Currency ? null : toAmount,

                FromAccountId = fromAcc.Id,
                ToAccountId = toAcc.Id,
                TransactionDate = DateTime.UtcNow,
                BalanceBefore = balanceBefore,
                BalanceAfter = fromAcc.Balance,
                Note = request.Note ?? ""
            };

            _context.Transactions.Add(trans);
            await _context.SaveChangesAsync();
            await dbTrans.CommitAsync();
            return trans;
        }
        catch { await dbTrans.RollbackAsync(); throw; }
    }

    /// <summary>
    /// TODO Hàm lấy chi tiết transaction theo id (bao gồm cả thông tin category, account, khoản vay nếu có)
    /// </summary>
    /// <param name="id"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<Transaction?> GetTransactionByIdAsync(int id, int userId) =>
    await _context.Transactions
        .Include(t => t.Category)
        .Include(t => t.FromAccount)
        .Include(t => t.ToAccount)
        .Include(t => t.Loan)
        .Include(t => t.TransactionImages)
        .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

    /// <summary>
    /// TODO Lấy danh sách các transaction theo filter (account, category, date, type) và phân trang
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="accountId"></param>
    /// <param name="type"></param>
    /// <param name="categoryId"></param>
    /// <param name="fromDate"></param>
    /// <param name="toDate"></param>
    /// <param name="searchQuery"></param>
    /// <param name="isIn"></param>
    /// <param name="page"></param>
    /// <param name="pageSize"></param>
    /// <returns></returns>
    public async Task<PagedResult<TransactionResponse>> GetHistoryAsync(int userId, int? accountId, string? type, int? categoryId, DateTime? fromDate, DateTime? toDate, string? searchQuery, bool? isIn, int page, int pageSize)
    {
        var query = _context.Transactions
        .Include(t => t.Category)
        .Include(t => t.FromAccount)
        .Include(t => t.ToAccount)
        .Include(t => t.Loan)
        .Include(t => t.TransactionImages)
        .Where(t => t.UserId == userId);

        // Filter
        if (accountId.HasValue) query = query.Where(t => t.FromAccountId == accountId || t.ToAccountId == accountId);
        if (categoryId.HasValue && categoryId > 0) query = query.Where(t => t.CategoryId == categoryId);

        // Xử lý query theo giờ
        var vnZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        if (fromDate.HasValue)
        {
            var fromLocal = DateTime.SpecifyKind(fromDate.Value, DateTimeKind.Unspecified);
            fromDate = TimeZoneInfo.ConvertTimeToUtc(fromLocal, vnZone); //Chuyển sang giờ UTC
            query = query.Where(t => t.TransactionDate >= fromDate);
        }
        if (toDate.HasValue)
        {
            var toLocal = DateTime.SpecifyKind(toDate.Value.AddDays(1), DateTimeKind.Unspecified);
            toDate = TimeZoneInfo.ConvertTimeToUtc(toLocal, vnZone);
            query = query.Where(t => t.TransactionDate < toDate);
        }

        if (!string.IsNullOrWhiteSpace(type) && type.ToLower() != "all")
        {
            var normalizedType = NormalizeType(type);
            query = query.Where(t => t.Type == normalizedType);
        }
        if (!string.IsNullOrWhiteSpace(searchQuery))
            query = query.Where(t => t.Note.Contains(searchQuery));

        if (isIn.HasValue)
        {
            if (isIn.Value)
                query = query.Where(t => t.Type == "income" || t.Type == "borrow");
            else
                query = query.Where(t => t.Type == "expense" || t.Type == "lend" || t.Type == "transfer");
        }

        // Lấy tổng số lượng trước khi phân trang
        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TransactionResponse
            {
                Id = t.Id,
                Amount = t.Amount,
                Currency = t.Currency,
                Type = t.Type,
                TransactionDate = t.TransactionDate,
                ImageUrls = t.TransactionImages != null
                    ? t.TransactionImages.Select(i => i.ImageUrl).ToList()
                    : new List<string>(),
                Note = t.Note,

                CategoryId = t.CategoryId,
                CategoryName = t.Category != null ? t.Category.Name : "Chưa phân loại",
                CategoryIcon = t.Category != null ? t.Category.Icon : "Tag",
                CategoryColor = t.Category != null ? t.Category.Color : "#cbd5e1",

                FromAccountId = t.FromAccountId,
                ToAccountId = t.ToAccountId,

                AccountName = t.Type == "transfer"
                    ? $"{t.FromAccount!.Name} → {t.ToAccount!.Name}"
                    : t.FromAccount != null ? t.FromAccount.Name :
                     (t.ToAccount != null ? t.ToAccount.Name : "Không xác định"),
                Loan = t.Loan != null ? new LoanDto
                {
                    Id = t.Loan.Id,
                    CounterPartyName = t.Loan.CounterPartyName,
                    PrincipalAmount = t.Loan.PrincipalAmount,
                    RemainingAmount = t.Loan.RemainingAmount,
                    InterestRate = t.Loan.InterestRate,
                    StartDate = t.Loan.StartDate,
                    DueDate = t.Loan.DueDate,
                    IsCompleted = t.Loan.IsCompleted
                } : null
            }).ToListAsync();

        return new PagedResult<TransactionResponse>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    /// <summary>
    /// TODO Hàm lấy danh sách giao dịch theo filter (account, category, date) để xuất file Excel
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="accountId"></param>
    /// <param name="categoryId"></param>
    /// <param name="fromDate"></param>
    /// <param name="toDate"></param>
    /// <returns></returns>
    public async Task<List<TransactionResponse>> GetTransactionsForExportAsync(
     int userId,
     int? accountId,
     int? categoryId,
     DateTime? fromDate,
     DateTime? toDate
 )
    {
        var query = _context.Transactions
            .Include(t => t.Category)
            .Include(t => t.FromAccount)
            .Include(t => t.ToAccount)
            .Include(t => t.Loan)
            .Include(t => t.TransactionImages)
            .Where(t => t.UserId == userId);

        // Filter
        if (accountId.HasValue)
            query = query.Where(t => t.FromAccountId == accountId || t.ToAccountId == accountId);

        if (categoryId.HasValue)
            query = query.Where(t => t.CategoryId == categoryId);

        // Xử lý timezone 
        var vnZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

        if (fromDate.HasValue)
        {
            var fromLocal = DateTime.SpecifyKind(fromDate.Value, DateTimeKind.Unspecified);
            var fromUtc = TimeZoneInfo.ConvertTimeToUtc(fromLocal, vnZone);
            query = query.Where(t => t.TransactionDate >= fromUtc);
        }

        if (toDate.HasValue)
        {
            var toLocal = DateTime.SpecifyKind(toDate.Value.AddDays(1), DateTimeKind.Unspecified);
            var toUtc = TimeZoneInfo.ConvertTimeToUtc(toLocal, vnZone);
            query = query.Where(t => t.TransactionDate < toUtc);
        }

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .Select(t => new TransactionResponse
            {
                Id = t.Id,
                Amount = t.Amount,
                Currency = t.Currency,
                Type = t.Type,
                TransactionDate = t.TransactionDate,
                ImageUrls = t.TransactionImages != null
                    ? t.TransactionImages.Select(i => i.ImageUrl).ToList()
                    : new List<string>(),
                Note = t.Note,

                CategoryId = t.CategoryId,
                CategoryName = t.Category != null ? t.Category.Name : "Chưa phân loại",
                CategoryIcon = t.Category != null ? t.Category.Icon : "Tag",
                CategoryColor = t.Category != null ? t.Category.Color : "#cbd5e1",

                FromAccountId = t.FromAccountId,
                ToAccountId = t.ToAccountId,

                AccountName = t.Type == "transfer"
                    ? $"{t.FromAccount!.Name} → {t.ToAccount!.Name}"
                    : t.FromAccount != null ? t.FromAccount.Name :
                      (t.ToAccount != null ? t.ToAccount.Name : "Không xác định"),

                Loan = t.Loan != null ? new LoanDto
                {
                    Id = t.Loan.Id,
                    CounterPartyName = t.Loan.CounterPartyName,
                    PrincipalAmount = t.Loan.PrincipalAmount,
                    RemainingAmount = t.Loan.RemainingAmount,
                    InterestRate = t.Loan.InterestRate,
                    StartDate = t.Loan.StartDate,
                    DueDate = t.Loan.DueDate,
                    IsCompleted = t.Loan.IsCompleted
                } : null
            })
            .ToListAsync();

        return items;
    }

    /// <summary>
    /// TODO Xuất giao dịch ra file Excel theo filter (account, category, date, type) để user có thể tải về
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="accountId"></param>
    /// <param name="categoryId"></param>
    /// <param name="fromDate"></param>
    /// <param name="toDate"></param>
    /// <returns></returns>
    public async Task<byte[]> ExportTransactionsToExcelAsync(
    int userId,
    int? accountId,
    int? categoryId,
    DateTime? fromDate,
    DateTime? toDate
)
    {
        var data = await GetTransactionsForExportAsync(
            userId, accountId, categoryId, fromDate, toDate);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Transactions");

        // Header
        worksheet.Cell(1, 1).Value = "Date";
        worksheet.Cell(1, 2).Value = "Type";
        worksheet.Cell(1, 3).Value = "Category";
        worksheet.Cell(1, 4).Value = "Account";
        worksheet.Cell(1, 5).Value = "Amount";
        worksheet.Cell(1, 6).Value = "Note";

        // Data
        for (int i = 0; i < data.Count; i++)
        {
            var row = i + 2;

            worksheet.Cell(row, 1).Value = data[i].TransactionDate;
            worksheet.Cell(row, 2).Value = data[i].Type;
            worksheet.Cell(row, 3).Value = data[i].CategoryName;
            worksheet.Cell(row, 4).Value = data[i].AccountName;
            worksheet.Cell(row, 5).Value = data[i].Amount;
            worksheet.Cell(row, 6).Value = data[i].Note;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        return stream.ToArray();
    }



}