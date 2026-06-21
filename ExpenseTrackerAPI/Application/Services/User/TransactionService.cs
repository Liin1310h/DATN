using ExpenseTrackerAPI.Infrastructure.Data;
using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Application.DTOs;
using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Application.Interfaces.User;
using ExpenseTrackerAPI.Application.Interfaces.AI;
using ClosedXML.Excel;
using ExpenseTrackerAPI.Domain.Enums;
using ExpenseTrackerAPI.Application.DTOs.Ocr;

namespace ExpenseTrackerAPI.Application.Services;

public class TransactionService : ITransactionService
{
    private readonly AppDbContext _context;
    private readonly ICurrencyService _currencyService;
    private readonly IPersonalCategoryRuleService _personalCategoryRuleService;
    private readonly IBudgetService _budgetService;
    private readonly ILogger<TransactionService> _logger;
    public TransactionService(AppDbContext context, ICurrencyService currencyService, IPersonalCategoryRuleService personalCategoryRuleService, IBudgetService budgetService, ILogger<TransactionService> logger)
    {
        _context = context;
        _currencyService = currencyService;
        _personalCategoryRuleService = personalCategoryRuleService;
        _budgetService = budgetService;
        _logger = logger;
    }

    //Helper
    private static bool IsExpenseLike(TransactionType type) => type is TransactionType.Expense;
    private static bool IsIncomeLike(TransactionType type) => type is TransactionType.Income;

    /// <summary>
    /// !Hàm check xem transaction có phải kiểu expense hoặc income không
    /// </summary>
    /// <param name="type"></param>
    /// <exception cref="Exception"></exception>
    private static void EnsureNormalTransactionType(TransactionType type)
    {
        if (type is not (TransactionType.Income or TransactionType.Expense))
            throw new Exception("TransactionService chỉ hỗ trợ income hoặc expense");

    }

    /// <summary>
    /// !Chuẩn hoá ngày tháng
    /// </summary>
    /// <param name="date"></param>
    /// <returns></returns>
    private static DateTime NormalizeTransactionDate(DateTime? date)
    {
        if (!date.HasValue)
            return DateTime.UtcNow;

        if (date.Value.Kind == DateTimeKind.Utc)
            return date.Value;

        return DateTime.SpecifyKind(date.Value, DateTimeKind.Local).ToUniversalTime();
    }

    /// <summary>
    /// ! Chuẩn hoá tiền tệ
    /// </summary>
    /// <param name="currency"></param>
    /// <returns></returns>
    private static string NormalizeCurrency(string? currency)
    {
        return string.IsNullOrWhiteSpace(currency)
            ? "VND"
            : currency.Trim().ToUpperInvariant();
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
    /// !Check xem category có hợp lệ không
    /// </summary>
    /// <param name="categoryId"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    private async Task EnsureCategoryIsValidAsync(int? categoryId, int userId)
    {
        if (!categoryId.HasValue)
            return;

        var exists = await _context.Categories.AnyAsync(c =>
            c.Id == categoryId.Value &&
            (c.UserId == null || c.UserId == userId));

        if (!exists)
            throw new Exception("Danh mục không tồn tại hoặc không thuộc quyền sử dụng của bạn.");
    }

    /// <summary>
    /// !Hàm chuyển tiền tệ
    /// </summary>
    /// <param name="amount"></param>
    /// <param name="fromCurrency"></param>
    /// <param name="toCurrency"></param>
    /// <returns></returns>
    private async Task<decimal> ConvertIfNeededAsync(decimal amount, string fromCurrency, string toCurrency)
    {
        if (string.Equals(fromCurrency, toCurrency, StringComparison.OrdinalIgnoreCase)) return amount;

        return await _currencyService.ConvertAsync(amount, fromCurrency, toCurrency);
    }

    /// <summary>
    /// !Hàm tính số tiền thực tế áp dụng cho account sau khi đã chuyển đổi nếu cần thiết
    /// </summary>
    /// <param name="transaction"></param>
    /// <param name="account"></param>
    /// <returns></returns>
    private async Task<decimal> GetAppliedAmountForAccountAsync(Transaction transaction, Account account)
    {
        if (transaction.ConvertedAmount.HasValue &&
            string.Equals(transaction.ConvertedCurrency, account.Currency, StringComparison.OrdinalIgnoreCase))
        {
            return transaction.ConvertedAmount.Value;
        }

        if (string.Equals(transaction.Currency, account.Currency, StringComparison.OrdinalIgnoreCase))
            return transaction.Amount;

        return await ConvertIfNeededAsync(transaction.Amount, transaction.Currency, account.Currency);
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

        if (request.Amount <= 0) throw new Exception("Số tiền phải lớn hơn 0.");

        await EnsureCategoryIsValidAsync(request.CategoryId, userId);

        var transactionDate = NormalizeTransactionDate(request.TransactionDate);
        var transactionCurrency = NormalizeCurrency(request.Currency);

        // Bắt đầu giao dịch
        await using var dbTrans = await _context.Database.BeginTransactionAsync();
        Transaction transaction;
        try
        {
            var account = await GetOwnedAccountAsync(request.AccountId, userId);

            var appliedAmount = await ConvertIfNeededAsync(request.Amount, transactionCurrency, account.Currency);

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

            var sameCurrency = string.Equals(transactionCurrency, account.Currency, StringComparison.OrdinalIgnoreCase);

            transaction = new Transaction
            {
                UserId = userId,
                Type = request.Type,
                Amount = request.Amount,
                Currency = transactionCurrency,
                ConvertedCurrency = sameCurrency ? null : account.Currency,
                ConvertedAmount = sameCurrency ? null : appliedAmount,

                FromAccountId = IsExpenseLike(request.Type) ? account.Id : null,
                ToAccountId = IsIncomeLike(request.Type) ? account.Id : null,

                CategoryId = request.CategoryId,
                LoanId = null,
                Note = request.Note ?? "",

                TransactionDate = transactionDate,
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
            }

            if (transaction.Type == TransactionType.Expense)
            {
                await _budgetService.ApplyExpenseAsync(
                    userId,
                    transaction.CategoryId,
                    transaction.TransactionDate,
                    transaction.Amount,
                    transaction.Currency);
            }

            await _context.SaveChangesAsync();
            await dbTrans.CommitAsync();
        }
        catch
        {
            await dbTrans.RollbackAsync(); throw;
        }

        await RunAfterTransactionCommittedAsync(transaction, null);
        return transaction;
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

        if (request.Amount <= 0) throw new Exception("Số tiền phải lớn hơn 0.");

        await EnsureCategoryIsValidAsync(request.CategoryId, userId);

        var newTransactionDate = NormalizeTransactionDate(request.TransactionDate);
        var newCurrency = NormalizeCurrency(request.Currency);

        await using var dbTrans = await _context.Database.BeginTransactionAsync();

        Transaction transaction;
        TransactionSnapshot oldSnapshot;
        try
        {
            transaction = await _context.Transactions
                .Include(t => t.TransactionImages)
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId)
                ?? throw new Exception("Giao dịch không tồn tại.");

            if (transaction.LoanId != null)
                throw new Exception("Không được cập nhật giao dịch thuộc khoản vay ở TransactionService");

            EnsureNormalTransactionType(transaction.Type);
            oldSnapshot = new TransactionSnapshot
            {
                Type = transaction.Type,
                Amount = transaction.Amount,
                Currency = transaction.Currency,
                CategoryId = transaction.CategoryId,
                TransactionDate = transaction.TransactionDate,
                Note = transaction.Note
            };

            var oldAccountId = transaction.FromAccountId ?? transaction.ToAccountId;
            if (oldAccountId == null)
                throw new Exception("Transaction không có account hợp lệ.");

            var oldAccount = await GetOwnedAccountAsync(oldAccountId.Value, userId);

            // 1. Rollback số dư cũ
            decimal oldAppliedAmount = await GetAppliedAmountForAccountAsync(transaction, oldAccount);

            if (IsExpenseLike(transaction.Type))
            {
                oldAccount.Balance += oldAppliedAmount;
                await _budgetService.RollbackExpenseAsync(
                    userId,
                    transaction.CategoryId,
                    transaction.TransactionDate,
                    transaction.Amount,
                    transaction.Currency);
            }
            else if (IsIncomeLike(transaction.Type))
            {
                if (oldAccount.Balance < oldAppliedAmount)
                    throw new Exception("Không thể cập nhật vì số dư hiện tại không đủ để hoàn tác giao dịch");
                oldAccount.Balance -= oldAppliedAmount;
            }

            // 2. Áp dụng số dư mới
            var newAccount = (oldAccountId == request.AccountId) ? oldAccount : await GetOwnedAccountAsync(request.AccountId, userId);
            decimal newAppliedAmount = await ConvertIfNeededAsync(request.Amount, newCurrency, newAccount.Currency);
            decimal balanceBefore = newAccount.Balance;

            if (IsExpenseLike(request.Type))
            {
                if (newAccount.Balance < newAppliedAmount) throw new Exception("Số dư tài khoản mới không đủ.");
                newAccount.Balance -= newAppliedAmount;

                await _budgetService.ApplyExpenseAsync(
                    userId,
                    request.CategoryId,
                    newTransactionDate,
                    request.Amount,
                    newCurrency);
            }
            else newAccount.Balance += newAppliedAmount;

            var sameCurrency = string.Equals(newCurrency, newAccount.Currency, StringComparison.OrdinalIgnoreCase);

            // 3. Cập nhật Transaction object
            transaction.Type = request.Type;
            transaction.Amount = request.Amount;
            transaction.Currency = newCurrency;

            transaction.ConvertedCurrency = sameCurrency ? null : newAccount.Currency;
            transaction.ConvertedAmount = sameCurrency ? null : newAppliedAmount;

            transaction.FromAccountId = IsExpenseLike(request.Type) ? request.AccountId : null;
            transaction.ToAccountId = IsIncomeLike(request.Type) ? request.AccountId : null;

            transaction.CategoryId = request.CategoryId;
            transaction.Note = request.Note ?? string.Empty;
            transaction.TransactionDate = newTransactionDate;

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
            await dbTrans.CommitAsync();
        }
        catch { await dbTrans.RollbackAsync(); throw; }

        await RunAfterTransactionCommittedAsync(transaction, oldSnapshot);
        return transaction;
    }

    /// <summary>
    /// TODO Hàm xoá transaction
    /// </summary>
    /// <param name="id"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task DeleteTransactionAsync(int id, int userId)
    {
        await using var dbTrans = await _context.Database.BeginTransactionAsync();
        TransactionSnapshot oldSnapshot;

        try
        {
            var transaction = await _context.Transactions
                .Include(t => t.TransactionImages)
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (transaction == null) throw new Exception("Không thấy giao dịch.");

            if (transaction.LoanId != null)
                throw new Exception("Không được xoá transaction thuộc khoản vay ở TransactionService");

            oldSnapshot = new TransactionSnapshot
            {
                Type = transaction.Type,
                Amount = transaction.Amount,
                Currency = transaction.Currency,
                CategoryId = transaction.CategoryId,
                TransactionDate = transaction.TransactionDate,
                Note = transaction.Note
            };

            if (transaction.Type == TransactionType.Transfer)
            {
                if (!transaction.FromAccountId.HasValue || !transaction.ToAccountId.HasValue)
                    throw new Exception("Giao dịch chuyển tiền không có đủ tài khoản nguồn và tài khoản đích.");

                var fromAccount = await GetOwnedAccountAsync(transaction.FromAccountId.Value, userId);
                var toAccount = await GetOwnedAccountAsync(transaction.ToAccountId.Value, userId);

                var fromAppliedAmount = await GetAppliedAmountForAccountAsync(transaction, fromAccount);
                var toAppliedAmount = await GetAppliedAmountForAccountAsync(transaction, toAccount);

                if (toAccount.Balance < toAppliedAmount)
                    throw new Exception("Không thể xoá giao dịch chuyển tiền vì số dư tài khoản nhận không đủ để hoàn tác.");

                fromAccount.Balance += fromAppliedAmount;
                toAccount.Balance -= toAppliedAmount;
            }
            else
            {
                EnsureNormalTransactionType(transaction.Type);

                var accountId = transaction.FromAccountId ?? transaction.ToAccountId;
                if (accountId == null)
                    throw new Exception("Giao dịch không có tài khoản hợp lệ.");

                var account = await GetOwnedAccountAsync(accountId.Value, userId);
                var appliedAmount = await GetAppliedAmountForAccountAsync(transaction, account);

                //Hoàn hoặc thu hồi tiền cho tài khoản
                if (IsExpenseLike(transaction.Type))
                {
                    account.Balance += appliedAmount;
                    await _budgetService.RollbackExpenseAsync(userId, transaction.CategoryId, transaction.TransactionDate, transaction.Amount, transaction.Currency);
                }
                else if (IsIncomeLike(transaction.Type))
                {
                    if (account.Balance < appliedAmount)
                        throw new Exception("Không thể xoá giao dịch vì số dư hiện tại không đủ để rollback");
                    account.Balance -= appliedAmount;
                }
            }
            if (transaction.TransactionImages.Any())
            {
                _context.TransactionImages.RemoveRange(transaction.TransactionImages);
            }
            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();
            await dbTrans.CommitAsync();
        }
        catch { await dbTrans.RollbackAsync(); throw; }

        await RunAfterDeleteCommittedAsync(userId, oldSnapshot);
    }

    /// <summary>
    /// TODO Chuyển tiền nội bộ giữa 2 tài khoản của user
    /// </summary>
    /// <param name="request"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<Transaction> TransferAsync(TransferRequest request, int userId)
    {
        if (request.Amount <= 0)
            throw new Exception("Số tiền chuyển phải lớn hơn 0.");

        if (request.FromAccountId == request.ToAccountId)
            throw new Exception("Tài khoản chuyển và nhận không được trùng nhau");

        await using var dbTrans = await _context.Database.BeginTransactionAsync();
        try
        {
            var fromAcc = await GetOwnedAccountAsync(request.FromAccountId, userId);
            var toAcc = await GetOwnedAccountAsync(request.ToAccountId, userId);

            if (fromAcc.Balance < request.Amount)
                throw new Exception("Số dư không đủ chuyển.");

            decimal balanceBefore = fromAcc.Balance;
            decimal toAmount = await ConvertIfNeededAsync(request.Amount, fromAcc.Currency, toAcc.Currency);

            fromAcc.Balance -= request.Amount;
            toAcc.Balance += toAmount;

            var sameCurrency = string.Equals(fromAcc.Currency, toAcc.Currency, StringComparison.OrdinalIgnoreCase);

            var trans = new Transaction
            {
                UserId = userId,
                Type = TransactionType.Transfer,
                Amount = request.Amount,
                Currency = fromAcc.Currency,
                ConvertedCurrency = sameCurrency ? null : toAcc.Currency,
                ConvertedAmount = sameCurrency ? null : toAmount,

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
    public async Task<PagedResult<TransactionResponse>> GetHistoryAsync(int userId, int? accountId, TransactionType? type, int? categoryId, DateTime? fromDate, DateTime? toDate, string? searchQuery, bool? isIn, int page, int pageSize)
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

        if (type.HasValue)
        {
            if (type != TransactionType.Borrow
                && type != TransactionType.Lend
                && type != TransactionType.Transfer
                && type != TransactionType.Expense
                && type != TransactionType.Income)
            {
                throw new Exception("Filter type không hợp lệ.");
            }

            query = query.Where(t => t.Type == type.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchQuery))
            query = query.Where(t => t.Note.Contains(searchQuery));

        if (isIn.HasValue)
        {
            if (accountId.HasValue)
            {
                query = isIn.Value
                    ? query.Where(t => t.ToAccountId == accountId.Value)
                    : query.Where(t => t.FromAccountId == accountId.Value);
            }
            else
            {
                if (isIn.Value)
                {
                    query = query.Where(t =>
                        t.Type == TransactionType.Income ||
                        t.Type == TransactionType.Borrow);
                }
                else
                {
                    query = query.Where(t =>
                        t.Type == TransactionType.Expense ||
                        t.Type == TransactionType.Lend ||
                        t.Type == TransactionType.Transfer);
                }
            }
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

                AccountName = t.Type == TransactionType.Transfer
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

                AccountName = t.Type == TransactionType.Transfer
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

            worksheet.Cell(row, 1).Value = data[i].TransactionDate.ToLocalTime();
            worksheet.Cell(row, 1).Style.DateFormat.Format = "dd/MM/yyyy HH:mm";
            worksheet.Cell(row, 2).Value = data[i].Type switch
            {
                TransactionType.Income => "Thu nhập",
                TransactionType.Expense => "Chi tiêu",
                TransactionType.Transfer => "Chuyển khoản",
                TransactionType.Borrow => "Đi vay",
                TransactionType.Lend => "Cho vay",
                _ => data[i].Type.ToString()
            };
            worksheet.Cell(row, 3).Value = data[i].CategoryName;
            worksheet.Cell(row, 4).Value = data[i].AccountName;
            worksheet.Cell(row, 5).Value = (double)data[i].Amount;
            worksheet.Cell(row, 5).Style.NumberFormat.Format = "#,##0.00";
            worksheet.Cell(row, 6).Value = data[i].Note;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        return stream.ToArray();
    }

    public async Task<List<object>> CreateTransactionsFromReceiptAsync(CreateTransactionsFromReceiptRequest request, int userId)
    {
        if (request.Transactions == null || !request.Transactions.Any())
            throw new Exception("Không có giao dịch nào để lưu.");

        var selected = request.Transactions
            .Where(x => x.Selected)
            .ToList();

        if (!selected.Any())
            throw new Exception("Bạn chưa chọn giao dịch nào.");

        var createdTransactions = new List<Transaction>();

        await using var dbTrans = await _context.Database.BeginTransactionAsync();

        try
        {
            foreach (var item in selected)
            {
                // OCR hóa đơn luôn là khoản chi
                var transactionType = TransactionType.Expense;

                EnsureNormalTransactionType(transactionType);

                if (item.Amount <= 0)
                    throw new Exception("Số tiền phải lớn hơn 0.");

                await EnsureCategoryIsValidAsync(item.CategoryId, userId);

                var accountId = item.FromAccountId ?? request.DefaultAccountId;

                if (accountId <= 0)
                    throw new Exception("Tài khoản không hợp lệ.");

                var transactionDate = NormalizeTransactionDate(item.TransactionDate);
                var transactionCurrency = NormalizeCurrency(item.Currency);

                var account = await GetOwnedAccountAsync(accountId, userId);

                var appliedAmount = await ConvertIfNeededAsync(
                    item.Amount,
                    transactionCurrency,
                    account.Currency
                );

                decimal balanceBefore = account.Balance;

                if (account.Balance < appliedAmount)
                    throw new Exception(
                        $"Số dư tài khoản {account.Name} không đủ để lưu giao dịch {item.Note}."
                    );

                account.Balance -= appliedAmount;

                var sameCurrency = string.Equals(
                    transactionCurrency,
                    account.Currency,
                    StringComparison.OrdinalIgnoreCase
                );

                var transaction = new Transaction
                {
                    UserId = userId,

                    Type = TransactionType.Expense,

                    Amount = item.Amount,
                    Currency = transactionCurrency,

                    ConvertedCurrency = sameCurrency ? null : account.Currency,
                    ConvertedAmount = sameCurrency ? null : appliedAmount,

                    FromAccountId = account.Id,
                    ToAccountId = null,

                    CategoryId = item.CategoryId,
                    LoanId = null,

                    Note = item.Note ?? "",

                    TransactionDate = transactionDate,

                    BalanceBefore = balanceBefore,
                    BalanceAfter = account.Balance
                };

                _context.Transactions.Add(transaction);

                await _context.SaveChangesAsync();

                await _budgetService.ApplyExpenseAsync(
                    userId,
                    transaction.CategoryId,
                    transaction.TransactionDate,
                    transaction.Amount,
                    transaction.Currency
                );

                await _context.SaveChangesAsync();

                createdTransactions.Add(transaction);
            }

            await dbTrans.CommitAsync();
        }
        catch
        {
            await dbTrans.RollbackAsync();
            throw;
        }

        foreach (var transaction in createdTransactions)
        {
            await RunAfterTransactionCommittedAsync(transaction, null);
        }

        return createdTransactions.Select(x => new
        {
            x.Id,
            x.Amount,
            x.Currency,
            x.ConvertedAmount,
            x.ConvertedCurrency,
            x.Type,
            x.TransactionDate,
            x.Note,
            x.CategoryId,
            x.FromAccountId,
            x.ToAccountId,
            x.BalanceBefore,
            x.BalanceAfter
        }).Cast<object>().ToList();
    }

    private async Task RunAfterTransactionCommittedAsync(
       Transaction transaction,
       TransactionSnapshot? oldSnapshot)
    {
        try
        {
            if (oldSnapshot != null)
            {
                await _personalCategoryRuleService.UnlearnAsync(
                    transaction.UserId,
                    oldSnapshot.Note,
                    oldSnapshot.Type,
                    oldSnapshot.CategoryId);
            }

            await _personalCategoryRuleService.LearnAsync(
                transaction.UserId,
                transaction.Note,
                transaction.Type,
                transaction.CategoryId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể cập nhật personal category rule cho transaction {TransactionId}", transaction.Id);
        }

        try
        {
            if (IsExpenseLike(transaction.Type))
            {
                await _budgetService.CheckBudgetAlertAsync(
                    transaction.UserId,
                    transaction.CategoryId,
                    transaction.TransactionDate);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể kiểm tra cảnh báo budget cho transaction {TransactionId}", transaction.Id);
        }
    }

    private async Task RunAfterDeleteCommittedAsync(
        int userId,
        TransactionSnapshot oldSnapshot)
    {
        try
        {
            await _personalCategoryRuleService.UnlearnAsync(
                userId,
                oldSnapshot.Note,
                oldSnapshot.Type,
                oldSnapshot.CategoryId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể xoá personal category rule sau khi xoá transaction.");
        }
    }

    private sealed class TransactionSnapshot
    {
        public TransactionType Type { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "VND";
        public int? CategoryId { get; set; }
        public DateTime TransactionDate { get; set; }
        public string Note { get; set; } = string.Empty;
    }
}