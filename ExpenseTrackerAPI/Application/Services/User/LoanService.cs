using ExpenseTrackerAPI.Infrastructure.Data;
using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Application.DTOs;
using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Application.Interfaces.User;
using ExpenseTrackerAPI.Domain.Enums;

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
    /// Tính ngày nhắc nợ tiếp theo
    /// </summary>
    /// <param name="dueDate"></param>
    /// <param name="isRecurringReminder"></param>
    /// <param name="reminderBeforeDays"></param>
    /// <returns></returns>
    private DateTime? CalculateNextReminderDate(DateTime? dueDate, bool isRecurringReminder, int reminderBeforeDays)
    {
        if (!isRecurringReminder || !dueDate.HasValue) return null;
        if (reminderBeforeDays < 0)
            throw new Exception("Số ngày nhắc trước không hợp lệ.");
        return dueDate.Value.AddDays(-reminderBeforeDays);
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

                Duration = request.Duration,
                DurationUnit = request.DurationUnit,

                InterestCalculationType = request.InterestCalculationType,

                StartDate = request.StartDate,
                DueDate = request.DueDate,
                Note = request.Note ?? "",
                IsLending = request.IsLending,
                IsCompleted = false,

                IsRecurringReminder = request.IsRecurringReminder,
                ReminderBeforeDays = request.ReminderBeforeDays,
                ReminderFrequency = request.ReminderFrequency,
                NextReminderDate = CalculateNextReminderDate(
                    request.DueDate,
                    request.IsRecurringReminder,
                    request.ReminderBeforeDays)
            };

            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();

            var durationMonths = ResolveDurationMonths(request.Duration, request.DurationUnit);

            GenerateRepaymentSchedules(loan, durationMonths);
            await _context.SaveChangesAsync();

            // Xác định loại giao dịch: Cho vay (Lend) -> Ví giảm | Đi vay (Borrow) -> Ví tăng
            TransactionType transType = request.IsLending ? TransactionType.Lend : TransactionType.Borrow;
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
        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var loan = await _context.Loans
                .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);

            if (loan == null)
                throw new Exception("Khoản vay không tồn tại.");

            var hasRepayment = await _context.RepaymentSchedules
                .AnyAsync(s =>
                    s.LoanId == loanId &&
                    s.PaidTotalAmount > 0);

            if (!string.IsNullOrWhiteSpace(request.CounterPartyName))
                loan.CounterPartyName = request.CounterPartyName;

            bool interestChanged = false;
            if (request.InterestRate.HasValue)
            {
                if (request.InterestRate < 0)
                    throw new Exception("Lãi suất không hợp lệ.");

                if (loan.InterestRate != request.InterestRate.Value)
                    interestChanged = true;

                loan.InterestRate = request.InterestRate.Value;
            }

            if (request.InterestUnit.HasValue)
            {
                if (loan.InterestUnit != request.InterestUnit.Value)
                    interestChanged = true;

                loan.InterestUnit = request.InterestUnit.Value;
            }

            if (request.InterestCalculationType.HasValue)
            {
                if (loan.InterestCalculationType != request.InterestCalculationType.Value)
                    interestChanged = true;

                loan.InterestCalculationType = request.InterestCalculationType.Value;
            }

            if (interestChanged && hasRepayment)
            {
                throw new Exception("Không thể thay đổi lãi suất khi khoản vay đã phát sinh thanh toán.");
            }

            if (request.DueDate.HasValue && request.DueDate <= loan.StartDate)
            {
                throw new Exception("Ngày đáo hạn phải lớn hơn ngày bắt đầu.");
            }

            if (request.DueDate.HasValue)
            {
                loan.DueDate = request.DueDate.Value;
            }

            if (request.Note != null)
            {
                loan.Note = request.Note;
            }

            loan.IsRecurringReminder = request.IsRecurringReminder;
            loan.ReminderBeforeDays = request.ReminderBeforeDays;
            loan.ReminderFrequency = request.ReminderFrequency;

            loan.NextReminderDate = CalculateNextReminderDate(
                loan.DueDate,
                loan.IsRecurringReminder,
                loan.ReminderBeforeDays);

            if (interestChanged)
            {
                var schedules = await _context.RepaymentSchedules
                    .Where(s => s.LoanId == loanId)
                    .ToListAsync();

                _context.RepaymentSchedules.RemoveRange(schedules);

                await _context.SaveChangesAsync();

                _context.Loans.Update(loan);
                var durationMonths =
                    ResolveDurationMonths(
                        loan.Duration,
                        loan.DurationUnit);

                GenerateRepaymentSchedules(
                    loan,
                    durationMonths);
            }
            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();
        }
        catch (Exception)
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Trả tiền theo kỳ hạn
    /// </summary>
    /// <param name="request"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<Transaction> ProcessRepaymentAsync(RepaymentRequest request, int userId)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Validate
            if (request.Amount <= 0)
                throw new Exception("Số tiền thanh toán phải lớn hơn 0.");

            var loan = await _context.Loans.FirstOrDefaultAsync(l => l.Id == request.LoanId && l.UserId == userId);
            if (loan == null)
                throw new Exception("Khoản vay không tồn tại.");
            if (loan.IsCompleted)
                throw new Exception("Khoản vay này đã được thanh toán xong.");

            var account = await GetOwnedAccountAsync(request.AccountId, userId);

            var initialTrans = await _context.Transactions
                .Where(t => t.LoanId == loan.Id && (t.Type == TransactionType.Lend || t.Type == TransactionType.Borrow))
                .OrderBy(t => t.TransactionDate)
                .FirstOrDefaultAsync();

            if (initialTrans == null)
                throw new Exception("Không tìm thấy giao dịch gốc của khoản vay.");

            var transactionDate = request.TransactionDate == default
                ? DateTime.UtcNow
                : request.TransactionDate.ToUniversalTime();

            var loanCurrency = initialTrans.Currency;
            var repaymentCurrency = string.IsNullOrWhiteSpace(request.Currency)
                ? account.Currency
                : request.Currency;

            var accountAppliedAmount = await ConvertIdNeededAsync(request.Amount, repaymentCurrency, account.Currency);

            var totalPaidInLoanCurrency = await ConvertIdNeededAsync(
            request.Amount,
            repaymentCurrency,
            loanCurrency
        );

            if (totalPaidInLoanCurrency <= 0)
                throw new Exception("Số tiền thanh toán không hợp lệ.");

            TransactionType repayTransType = initialTrans.Type == TransactionType.Lend ? TransactionType.Income : TransactionType.Expense;
            decimal balanceBefore = account.Balance;

            // Cập nhật số dư tài khoản
            if (repayTransType == TransactionType.Expense)
            {
                if (account.Balance < accountAppliedAmount)
                    throw new Exception("Số dư không đủ để trả nợ.");
                account.Balance -= accountAppliedAmount;
            }
            else
            {
                account.Balance += accountAppliedAmount;
            }

            var allocation = await ApplyPaymentToSchedulesAsync(
            loan.Id,
            request.Period,
            totalPaidInLoanCurrency,
            transactionDate
        );

            if (allocation.TotalPaid <= 0)
                throw new Exception("Không thể phân bổ số tiền thanh toán vào kỳ hạn.");

            if (allocation.PrincipalPaid > loan.RemainingAmount)
                throw new Exception("Số tiền gốc thanh toán vượt quá dư nợ còn lại.");

            loan.RemainingAmount -= allocation.PrincipalPaid;

            if (loan.RemainingAmount <= 0)
            {
                loan.RemainingAmount = 0;
                loan.IsCompleted = true;
                loan.IsRecurringReminder = false;
                loan.NextReminderDate = null;
            }

            var note = request.Note
                ?? $"[Trả nợ] Thanh toán cho: {loan.CounterPartyName}";

            note += $" | Gốc: {allocation.PrincipalPaid:N0} {loanCurrency}";
            note += $" | Lãi: {allocation.InterestPaid:N0} {loanCurrency}";


            // Ghi nhận Transaction trả nợ
            var repaymentTransaction = new Transaction
            {
                UserId = userId,
                Amount = request.Amount,
                Currency = repaymentCurrency,
                ConvertedAmount = repaymentCurrency == account.Currency ? null : accountAppliedAmount,

                Type = repayTransType,
                FromAccountId = repayTransType == TransactionType.Expense ? request.AccountId : null,
                ToAccountId = repayTransType == TransactionType.Income ? request.AccountId : null,

                BalanceBefore = balanceBefore,
                BalanceAfter = account.Balance,
                TransactionDate = transactionDate,
                LoanId = loan.Id,
                Note = note
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
        var query = _context.Loans
            .Include(l => l.Schedules.OrderBy(s => s.Period))
            .Include(l => l.Transactions.OrderByDescending(t => t.TransactionDate))
            .Where(l => l.UserId == userId);

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
            .Include(l => l.Schedules.OrderBy(s => s.Period))
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

                var appliedAmount = transaction.ConvertedAmount ?? transaction.Amount;

                switch (transaction.Type)
                {
                    // Cho vay => nhận tiền về
                    case TransactionType.Lend:
                        account.Balance += appliedAmount;
                        break;

                    // Đi vay => trả tiền
                    case TransactionType.Borrow:
                        if (account.Balance < appliedAmount)
                            throw new Exception("Không thể xóa khoản vay vì số dư hiện tại không đủ để hoàn tác giao dịch borrow.");
                        account.Balance -= appliedAmount;
                        break;

                    // Repayment của khoản cho vay: thu tiền về => rollback là trừ lại
                    case TransactionType.Income:
                        if (account.Balance < appliedAmount)
                            throw new Exception("Không thể xóa khoản vay vì số dư hiện tại không đủ để hoàn tác giao dịch repayment income.");
                        account.Balance -= appliedAmount;
                        break;

                    // Repayment của khoản đi vay: trả tiền đi => rollback là cộng lại
                    case TransactionType.Expense:
                        account.Balance += appliedAmount;
                        break;

                    default:
                        throw new Exception($"Loại transaction không hợp lệ khi xóa khoản vay: {transaction.Type}");
                }

                _context.Accounts.Update(account);
            }

            var schedules = await _context.RepaymentSchedules
                .Where(s => s.LoanId == loanId)
                .ToListAsync();

            _context.RepaymentSchedules.RemoveRange(schedules);
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

    #region Helper
    private static int ResolveDurationMonths(int duration, DurationUnit? durationUnit)
    {
        if (duration <= 0) return 0;

        var unit = durationUnit ?? DurationUnit.Month;
        return unit switch
        {
            DurationUnit.Month => duration,
            DurationUnit.Year => duration * 12,
            DurationUnit.Day => Math.Max(1, (int)Math.Ceiling(duration / 30m)),
            _ => duration
        };
    }
    /// <summary>
    /// Tạo kế hoạch trả nợ tuỳ vào loại lãi suất và kỳ hạn đã chọn
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="durationMonths"></param>
    /// <returns></returns>
    private void GenerateRepaymentSchedules(Loan loan, int durationMonths)
    {
        switch (loan.InterestCalculationType)
        {
            case InterestCalculationType.FlatRate:
                GenerateFlatRateSchedule(
                    loan,
                    durationMonths);
                break;

            case InterestCalculationType.ReducingBalance:
            default:
                GenerateReducingBalanceSchedule(
                    loan,
                    durationMonths);
                break;
        }
    }

    private void GenerateReducingBalanceSchedule(Loan loan, int durationMonths)
    {
        if (durationMonths <= 0) return;

        var monthlyPrincipal = Math.Round(loan.PrincipalAmount / durationMonths, 2);

        var monthlyInterestRate = GetMonthlyRate(loan);

        decimal remaining = loan.PrincipalAmount;

        for (int i = 1; i <= durationMonths; i++)
        {
            var principal = i == durationMonths
                ? remaining
                : monthlyPrincipal;

            var interest = Math.Round(remaining * monthlyInterestRate, 2);
            var total = principal + interest;

            remaining -= principal;
            if (remaining < 0) remaining = 0;

            _context.RepaymentSchedules.Add(new RepaymentSchedule
            {
                LoanId = loan.Id,
                Period = i,
                PrincipalAmount = principal,
                InterestAmount = interest,
                TotalAmount = total,
                RemainingBalance = remaining,
                DueDate = loan.StartDate.AddMonths(i),

                IsPaid = false,
                PaidDate = null,
                PaidPrincipalAmount = 0,
                PaidInterestAmount = 0,
                PaidTotalAmount = 0
            });
        }
    }

    private void GenerateFlatRateSchedule(
    Loan loan,
    int durationMonths)
    {
        if (durationMonths <= 0)
            return;

        var monthlyPrincipal =
            Math.Round(
                loan.PrincipalAmount / durationMonths,
                2);

        var monthlyRate =
            GetMonthlyRate(loan);

        var fixedInterest =
            Math.Round(
                loan.PrincipalAmount * monthlyRate,
                2);

        decimal remaining =
            loan.PrincipalAmount;

        for (int i = 1; i <= durationMonths; i++)
        {
            var principal =
                i == durationMonths
                    ? remaining
                    : monthlyPrincipal;

            remaining -= principal;

            if (remaining < 0)
                remaining = 0;

            _context.RepaymentSchedules.Add(
                new RepaymentSchedule
                {
                    LoanId = loan.Id,

                    Period = i,

                    PrincipalAmount = principal,

                    InterestAmount = fixedInterest,

                    TotalAmount =
                        principal + fixedInterest,

                    RemainingBalance =
                        remaining,

                    DueDate =
                        loan.StartDate.AddMonths(i),

                    IsPaid = false,

                    PaidPrincipalAmount = 0,
                    PaidInterestAmount = 0,
                    PaidTotalAmount = 0
                });
        }
    }

    private static decimal GetMonthlyRate(
    Loan loan)
    {
        return loan.InterestUnit switch
        {
            InterestUnit.PercentPerYear
                => loan.InterestRate / 100 / 12,

            InterestUnit.PercentPerMonth
                => loan.InterestRate / 100,

            _ => loan.InterestRate / 100
        };
    }

    private async Task<(decimal PrincipalPaid, decimal InterestPaid, decimal TotalPaid)> ApplyPaymentToSchedulesAsync(int loanId, int? period, decimal totalPaid, DateTime paidDate)
    {
        Console.WriteLine($"APPLY loanId={loanId}, period={period}, totalPaid={totalPaid}");
        var schedulesQuery = _context.RepaymentSchedules
            .Where(s => s.LoanId == loanId && !s.IsPaid);

        if (period.HasValue)
        {
            schedulesQuery = schedulesQuery.Where(s => s.Period == period.Value);
        }

        var schedules = await schedulesQuery
            .OrderBy(s => s.Period)
            .ToListAsync();

        if (!schedules.Any())
            return (0, 0, 0);

        var remainingPayment = totalPaid;

        decimal totalPrincipalPaid = 0;
        decimal totalInterestPaid = 0;
        decimal totalApplied = 0;

        foreach (var schedule in schedules)
        {
            if (remainingPayment <= 0)
                break;

            var unpaidInterest = schedule.InterestAmount - schedule.PaidInterestAmount;
            var unpaidPrincipal = schedule.PrincipalAmount - schedule.PaidPrincipalAmount;

            if (unpaidInterest < 0) unpaidInterest = 0;
            if (unpaidPrincipal < 0) unpaidPrincipal = 0;

            var applyInterest = Math.Min(remainingPayment, unpaidInterest);

            schedule.PaidInterestAmount += applyInterest;
            remainingPayment -= applyInterest;
            totalInterestPaid += applyInterest;
            totalApplied += applyInterest;

            if (remainingPayment > 0)
            {
                var applyPrincipal = Math.Min(remainingPayment, unpaidPrincipal);

                schedule.PaidPrincipalAmount += applyPrincipal;
                remainingPayment -= applyPrincipal;
                totalPrincipalPaid += applyPrincipal;
                totalApplied += applyPrincipal;
            }

            UpdateSchedulePaidStatus(schedule, paidDate);
        }

        return (totalPrincipalPaid, totalInterestPaid, totalApplied);
    }

    private static void UpdateSchedulePaidStatus(RepaymentSchedule schedule, DateTime paidDate)
    {
        schedule.PaidTotalAmount =
            schedule.PaidPrincipalAmount + schedule.PaidInterestAmount;

        if (schedule.PaidTotalAmount >= schedule.TotalAmount)
        {
            schedule.IsPaid = true;
            schedule.PaidDate = paidDate;
        }
    }
    #endregion
}