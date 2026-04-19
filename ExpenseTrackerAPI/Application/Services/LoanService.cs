using ExpenseTrackerAPI.Infrastructure.Data;
using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Application.DTOs;
using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Application.Interfaces;

namespace ExpenseTrackerAPI.Application.Services;

public class LoanService : ILoanService
{
    private readonly AppDbContext _context;
    private readonly ICurrencyService _currencyService;
    public LoanService(AppDbContext context, ICurrencyService currencyService)
    {
        _context = context;
        _currencyService = currencyService;
    }

    /// <summary>
    /// Check xem tài khoản có hợp lệ không
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
    /// Hàm chuyển tiền tệ
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
    /// Tạo loan
    /// </summary>
    /// <param name="request"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<Loan> CreateLoanAsync(LoanRequest request, int userId)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            if (request.PrincipalAmount <= 0)
                throw new Exception("Số tiền vay/ cho vay phải lớn hơn 0.");

            var account = await GetOwnedAccountAsync(request.AccountId, userId);
            var appliedAmount = await ConvertIdNeededAsync(request.PrincipalAmount, request.Currency, account.Currency);

            // Tạo đối tượng Loan
            var loan = new Loan
            {
                UserId = userId,
                Currency = request.Currency,
                CounterPartyName = request.CounterPartyName,
                PrincipalAmount = request.PrincipalAmount,
                RemainingAmount = request.PrincipalAmount,
                InterestRate = request.InterestRate,
                InterestUnit = request.InterestUnit,
                StartDate = request.StartDate,
                DueDate = request.DueDate,
                Note = request.Note ?? "",
                IsLending = request.IsLending,
                IsCompleted = false
            };

            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();

            // Xác định loại giao dịch: Cho vay (Lend) -> Ví giảm | Đi vay (Borrow) -> Ví tăng
            string transType = request.IsLending ? "lend" : "borrow";
            decimal balanceBefore = account.Balance;

            if (request.IsLending)
            {
                if (account.Balance < appliedAmount)
                    throw new Exception("Số dư tài khoản không đủ để thực hiện cho vay.");
                account.Balance -= appliedAmount;
            }
            else
            {
                account.Balance += appliedAmount;
            }

            var transaction = new Transaction
            {
                UserId = userId,
                Amount = request.PrincipalAmount,
                Currency = request.Currency,
                ConvertedAmount = request.Currency == account.Currency ? null : appliedAmount,

                Type = transType,
                FromAccountId = request.IsLending ? request.AccountId : null,
                ToAccountId = !request.IsLending ? request.AccountId : null,

                BalanceBefore = balanceBefore,
                BalanceAfter = account.Balance,
                TransactionDate = request.StartDate.Kind == DateTimeKind.Utc
                    ? request.StartDate
                    : request.StartDate.ToUniversalTime(),
                LoanId = loan.Id,
                Note = request.Note ?? $"[Vay nợ] Giao dịch giải ngân cho: {request.CounterPartyName}"
            };

            _context.Transactions.Add(transaction);
            _context.Accounts.Update(account);

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return loan;
        }
        catch (Exception)
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Cập nhật khoản vay
    /// </summary>
    /// <param name="loanId"></param>
    /// <param name="request"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async Task UpdateLoanAsync(int loanId, LoanUpdateRequest request, int userId)
    {
        var loan = await _context.Loans
            .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);

        if (loan == null)
            throw new Exception("Khoản vay không tồn tại.");

        if (!string.IsNullOrWhiteSpace(request.CounterPartyName))
            loan.CounterPartyName = request.CounterPartyName;

        if (request.InterestRate.HasValue)
            loan.InterestRate = request.InterestRate.Value;

        if (!string.IsNullOrEmpty(request.InterestUnit))
            loan.InterestUnit = request.InterestUnit;

        loan.DueDate = request.DueDate;

        if (request.Note != null)
        {
            loan.Note = request.Note;
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Trả tiền
    /// </summary>
    /// <param name="request"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<Transaction> ProcessRepaymentAsync(RepaymentRequest request, int userId)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            if (request.Amount <= 0)
                throw new Exception("Số tiền thanh toán phải lớn hơn 0.");

            var loan = await _context.Loans.FirstOrDefaultAsync(l => l.Id == request.LoanId && l.UserId == userId);
            if (loan == null)
                throw new Exception("Khoản vay không tồn tại.");
            if (loan.IsCompleted)
                throw new Exception("Khoản vay này đã được thanh toán xong.");

            var account = await GetOwnedAccountAsync(request.AccountId, userId);

            var initialTrans = await _context.Transactions
                .Where(t => t.LoanId == loan.Id && (t.Type == "lend" || t.Type == "borrow"))
                .OrderBy(t => t.TransactionDate)
                .FirstOrDefaultAsync();

            if (initialTrans == null)
                throw new Exception("Không tìm thấy giao dịch gốc của khoản vay.");

            var loanCurrency = initialTrans.Currency;
            var repaymentCurrency = string.IsNullOrWhiteSpace(request.Currency)
                ? account.Currency
                : request.Currency;

            var accountAppliedAmount = await ConvertIdNeededAsync(request.Amount, repaymentCurrency, account.Currency);

            var principalPaidInLoanCurrency = request.PrincipalPaid.HasValue
                ? await ConvertIdNeededAsync(request.PrincipalPaid.Value, repaymentCurrency, loanCurrency)
                : await ConvertIdNeededAsync(request.Amount, repaymentCurrency, loanCurrency);

            if (principalPaidInLoanCurrency <= 0)
                throw new Exception("PrincipalPaid không hợp lệ.");

            if (principalPaidInLoanCurrency > loan.RemainingAmount)
                throw new Exception("Số tiền gốc thanh toán vượt quá dư nợ còn lại.");

            string repayTransType = initialTrans?.Type == "lend" ? "income" : "expense";
            decimal balanceBefore = account.Balance;

            // Cập nhật số dư tài khoản
            if (repayTransType == "expense")
            {
                if (account.Balance < accountAppliedAmount)
                    throw new Exception("Số dư không đủ để trả nợ.");
                account.Balance -= accountAppliedAmount;
            }
            else
            {
                account.Balance += accountAppliedAmount;
            }

            loan.RemainingAmount -= principalPaidInLoanCurrency;

            if (loan.RemainingAmount <= 0)
            {
                loan.RemainingAmount = 0;
                loan.IsCompleted = true;
            }

            // Ghi nhận Transaction trả nợ
            var repaymentTransaction = new Transaction
            {
                UserId = userId,
                Amount = request.Amount,
                Currency = repaymentCurrency,
                ConvertedAmount = repaymentCurrency == account.Currency ? null : accountAppliedAmount,

                Type = repayTransType,
                FromAccountId = repayTransType == "expense" ? request.AccountId : null,
                ToAccountId = repayTransType == "income" ? request.AccountId : null,

                BalanceBefore = balanceBefore,
                BalanceAfter = account.Balance,
                TransactionDate = request.TransactionDate,
                LoanId = loan.Id,
                Note = request.Note ?? $"[Trả nợ] Thanh toán cho: {loan.CounterPartyName}"
            };

            _context.Transactions.Add(repaymentTransaction);
            _context.Loans.Update(loan);
            _context.Accounts.Update(account);

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return repaymentTransaction;
        }
        catch (Exception)
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Lấy thông tin loan theo userId
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="isCompleted"></param>
    /// <returns></returns>
    public async Task<IEnumerable<Loan>> GetUserLoansAsync(int userId, bool? isCompleted)
    {
        var query = _context.Loans.Where(l => l.UserId == userId);

        if (isCompleted.HasValue)
            query = query.Where(l => l.IsCompleted == isCompleted.Value);

        return await query
            .OrderByDescending(l => l.StartDate)
            .ToListAsync();
    }

    /// <summary>
    /// Xem chi tiết khoản vay
    /// </summary>
    /// <param name="loanId"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<Loan?> GetLoanDetailsAsync(int loanId, int userId)
    {
        return await _context.Loans
            .Include(l => l.Transactions.OrderByDescending(t => t.TransactionDate))
            .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);
    }

    /// <summary>
    /// Xoá khoản vay
    /// </summary>
    /// <param name="loanId"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task DeleteLoanAsync(int loanId, int userId)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var loan = await _context.Loans
                .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);

            if (loan == null)
                throw new Exception("Khoản vay không tồn tại.");

            var transactions = await _context.Transactions
                .Where(t => t.LoanId == loanId && t.UserId == userId)
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.Id)
                .ToListAsync();

            foreach (var transaction in transactions)
            {
                var accountId = transaction.FromAccountId ?? transaction.ToAccountId;
                if (accountId == null)
                    throw new Exception($"Transaction {transaction.Id} không có tài khoản hợp lệ.");

                var account = await GetOwnedAccountAsync(accountId.Value, userId);

                var appliedAmount = await ConvertIdNeededAsync(
                    transaction.Amount,
                    transaction.Currency,
                    account.Currency
                );

                switch (transaction.Type)
                {
                    // Cho vay => nhận tiền về
                    case "lend":
                        account.Balance += appliedAmount;
                        break;

                    // Đi vay => trả tiền
                    case "borrow":
                        if (account.Balance < appliedAmount)
                            throw new Exception("Không thể xóa khoản vay vì số dư hiện tại không đủ để hoàn tác giao dịch borrow.");
                        account.Balance -= appliedAmount;
                        break;

                    // Repayment của khoản cho vay: thu tiền về => rollback là trừ lại
                    case "income":
                        if (account.Balance < appliedAmount)
                            throw new Exception("Không thể xóa khoản vay vì số dư hiện tại không đủ để hoàn tác giao dịch repayment income.");
                        account.Balance -= appliedAmount;
                        break;

                    // Repayment của khoản đi vay: trả tiền đi => rollback là cộng lại
                    case "expense":
                        account.Balance += appliedAmount;
                        break;

                    default:
                        throw new Exception($"Loại transaction không hợp lệ khi xóa khoản vay: {transaction.Type}");
                }

                _context.Accounts.Update(account);
            }

            _context.Transactions.RemoveRange(transactions);
            _context.Loans.Remove(loan);

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }
}