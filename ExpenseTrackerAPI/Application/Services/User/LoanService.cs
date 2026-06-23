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
    /// TODO Tạo loan 
    /// </summary>
    /// <param name="request"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<Loan> CreateLoanAsync(LoanRequest request, int userId)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            ValidateCreateLoanRequest(request);

            var account = await GetOwnedAccountAsync(request.AccountId, userId);

            var loanCurrency = NormalizeCurrency(request.Currency);
            var accountCurrency = NormalizeCurrency(account.Currency);

            var startDate = NormalizeDateTime(request.StartDate);
            var dueDate = CalculateDueDate(startDate, request.Duration, request.DurationUnit);
            var durationMonths = ResolveDurationMonths(request.Duration, request.DurationUnit);

            ValidateRepaymentMethodWithDurationUnit(request.RepaymentMethod, request.DurationUnit);

            var appliedAmount = await ConvertIdNeededAsync(request.PrincipalAmount, loanCurrency, accountCurrency);

            var allocationStrategy = ResolveAllocationStrategy(request.CounterPartyType, request.AllocationStrategy);

            var interestRate = request.RepaymentMethod == RepaymentMethod.NoInterest ? 0 : request.InterestRate;

            // Tạo đối tượng Loan
            var loan = new Loan
            {
                UserId = userId,
                Currency = loanCurrency,

                CounterPartyType = request.CounterPartyType,
                CounterPartyName = request.CounterPartyName.Trim(),

                PrincipalAmount = request.PrincipalAmount,
                RemainingPrincipalAmount = request.PrincipalAmount,

                InterestRate = interestRate,
                InterestUnit = request.InterestUnit,

                Duration = request.Duration,
                DurationUnit = request.DurationUnit,

                StartDate = startDate,
                DueDate = dueDate,
                Note = request.Note?.Trim() ?? string.Empty,

                IsLending = request.IsLending,
                Status = LoanStatus.Active,

                RepaymentMethod = request.RepaymentMethod,
                PrepaymentPolicy = request.PrepaymentPolicy,
                AllocationStrategy = allocationStrategy,

                LateFeeRate = request.LateFeeRate,
                PrepaymentFeeRate = request.PrepaymentFeeRate,

                PaymentDayOfMonth = request.PaymentDayOfMonth,
                IsInterestAccruedDaily = request.IsInterestAccruedDaily,

                IsRecurringReminder = request.IsRecurringReminder,
                ReminderBeforeDays = request.ReminderBeforeDays,
                ReminderFrequency = request.ReminderFrequency,
                NextReminderDate = CalculateNextReminderDate(
                    dueDate,
                    request.IsRecurringReminder,
                    request.ReminderBeforeDays)
            };

            if (loan.PaymentDayOfMonth.HasValue &&
                 loan.RepaymentMethod is not RepaymentMethod.NoInterest and not RepaymentMethod.SinglePayment)
            {
                loan.DueDate = GetPeriodEndDate(loan, durationMonths);

                loan.NextReminderDate = CalculateNextReminderDate(
                    loan.DueDate,
                    loan.IsRecurringReminder,
                    loan.ReminderBeforeDays
                );
            }

            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();

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
                Currency = loanCurrency,
                ConvertedAmount = loanCurrency == accountCurrency ? null : appliedAmount,

                Type = transType,
                FromAccountId = request.IsLending ? request.AccountId : null,
                ToAccountId = !request.IsLending ? request.AccountId : null,

                BalanceBefore = balanceBefore,
                BalanceAfter = account.Balance,
                TransactionDate = startDate,
                LoanId = loan.Id,
                Note = BuildLoanDisbursementNote(loan)
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
    /// TODO Cập nhật khoản vay
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
                .Include(l => l.Schedules)
                .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);

            if (loan == null)
                throw new Exception("Khoản vay không tồn tại.");

            if (loan.Status == LoanStatus.Cancelled)
                throw new Exception("Không thể cập nhật khoản vay đã huỷ.");

            if (loan.Status == LoanStatus.Completed)
                throw new Exception("Không thể cập nhật khoản vay đã tất toán.");

            ValidateUpdateLoanRequest(request);

            var hasRepayment = loan.Schedules.Any(HasAnyPayment);

            var scheduleAffectingChanged = HasScheduleAffectingChange(loan, request);

            if (hasRepayment && scheduleAffectingChanged)
            {
                throw new Exception("Không thể thay đổi thông tin tính toán khi khoản vay đã phát sinh thanh toán.");
            }

            ApplyCommonLoanUpdates(loan, request);

            if (!hasRepayment && scheduleAffectingChanged)
            {
                ApplyScheduleAffectingLoanUpdates(loan, request);

                if (request.StartDate.HasValue)
                {
                    var initialTransaction = await _context.Transactions
                        .Where(t => t.LoanId == loan.Id &&
                                    (t.Type == TransactionType.Lend || t.Type == TransactionType.Borrow))
                        .OrderBy(t => t.TransactionDate)
                        .FirstOrDefaultAsync();

                    if (initialTransaction != null)
                    {
                        initialTransaction.TransactionDate = loan.StartDate;
                        _context.Transactions.Update(initialTransaction);
                    }
                }

                ValidateLoanForScheduleGeneration(loan);

                var durationMonths = ResolveDurationMonths(loan.Duration, loan.DurationUnit);

                if (loan.PaymentDayOfMonth.HasValue &&
                    loan.RepaymentMethod is not RepaymentMethod.NoInterest and not RepaymentMethod.SinglePayment)
                {
                    loan.DueDate = GetPeriodEndDate(loan, durationMonths);
                }
                else
                {
                    loan.DueDate = CalculateDueDate(
                        loan.StartDate,
                        loan.Duration,
                        loan.DurationUnit
                    );
                }

                var oldSchedules = loan.Schedules.ToList();

                _context.RepaymentSchedules.RemoveRange(oldSchedules);
                loan.Schedules.Clear();

                await _context.SaveChangesAsync();

                GenerateRepaymentSchedules(loan, durationMonths);
            }

            loan.NextReminderDate = CalculateNextReminderDate(
                loan.DueDate,
                loan.IsRecurringReminder,
                loan.ReminderBeforeDays
            );

            _context.Loans.Update(loan);

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// TODO Trả tiền theo kỳ hạn
    /// </summary>
    /// <param name="request"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<Transaction> ProcessRepaymentAsync(RepaymentRequest request, int userId)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();

        try
        {
            ValidateRepaymentRequest(request);

            var loan = await _context.Loans
                .Include(l => l.Schedules)
                .FirstOrDefaultAsync(l => l.Id == request.LoanId && l.UserId == userId);

            if (loan == null)
                throw new Exception("Khoản vay không tồn tại.");

            if (loan.Status == LoanStatus.Completed)
                throw new Exception("Khoản vay này đã được tất toán.");

            if (loan.Status == LoanStatus.Cancelled)
                throw new Exception("Khoản vay này đã bị huỷ.");

            var account = await GetOwnedAccountAsync(request.AccountId, userId);

            var transactionDate = request.TransactionDate == default
                ? DateTime.UtcNow
                : NormalizeDateTime(request.TransactionDate);

            var loanCurrency = NormalizeCurrency(loan.Currency);

            var repaymentCurrency = string.IsNullOrWhiteSpace(request.Currency)
                ? NormalizeCurrency(account.Currency)
                : NormalizeCurrency(request.Currency);

            var accountCurrency = NormalizeCurrency(account.Currency);

            var totalPaidInLoanCurrency = RoundMoney(
                await ConvertIdNeededAsync(
                    request.Amount,
                    repaymentCurrency,
                    loanCurrency
                )
            );

            if (totalPaidInLoanCurrency <= 0)
                throw new Exception("Số tiền thanh toán không hợp lệ.");

            var allocation = ApplyPaymentToSchedules(
                loan,
                request.Period,
                totalPaidInLoanCurrency,
                transactionDate
            );

            if (allocation.TotalPaid <= 0)
                throw new Exception("Không thể phân bổ số tiền thanh toán vào kỳ trả nợ.");

            if (allocation.UnappliedAmount > 0)
            {
                throw new Exception(
                    $"Số tiền thanh toán vượt quá số tiền cần trả: {allocation.UnappliedAmount:N0} {loanCurrency}."
                );
            }

            if (allocation.PrincipalPaid > loan.RemainingPrincipalAmount)
                throw new Exception("Số tiền gốc thanh toán vượt quá dư nợ gốc còn lại.");

            loan.RemainingPrincipalAmount = RoundMoney(
                loan.RemainingPrincipalAmount - allocation.PrincipalPaid
            );

            if (loan.RemainingPrincipalAmount < 0)
                loan.RemainingPrincipalAmount = 0;

            UpdateLoanStatusAfterRepayment(loan, transactionDate);

            var appliedAmountInRepaymentCurrency = RoundMoney(
                await ConvertIdNeededAsync(
                    allocation.TotalPaid,
                    loanCurrency,
                    repaymentCurrency
                )
            );

            var appliedAmountInAccountCurrency = RoundMoney(
                await ConvertIdNeededAsync(
                    allocation.TotalPaid,
                    loanCurrency,
                    accountCurrency
                )
            );

            var repaymentTransactionType = loan.IsLending
                ? TransactionType.Income
                : TransactionType.Expense;

            var balanceBefore = account.Balance;

            if (repaymentTransactionType == TransactionType.Expense)
            {
                if (account.Balance < appliedAmountInAccountCurrency)
                    throw new Exception("Số dư tài khoản không đủ để trả nợ.");

                account.Balance -= appliedAmountInAccountCurrency;
            }
            else
            {
                account.Balance += appliedAmountInAccountCurrency;
            }

            var repaymentTransaction = new Transaction
            {
                UserId = userId,

                Amount = appliedAmountInRepaymentCurrency,
                Currency = repaymentCurrency,
                ConvertedAmount = repaymentCurrency == accountCurrency
                    ? null
                    : appliedAmountInAccountCurrency,

                Type = repaymentTransactionType,

                FromAccountId = repaymentTransactionType == TransactionType.Expense
                    ? request.AccountId
                    : null,

                ToAccountId = repaymentTransactionType == TransactionType.Income
                    ? request.AccountId
                    : null,

                BalanceBefore = balanceBefore,
                BalanceAfter = account.Balance,

                TransactionDate = transactionDate,
                LoanId = loan.Id,

                Note = BuildRepaymentNote(
                    request.Note,
                    loan,
                    allocation,
                    loanCurrency
                )
            };

            _context.Transactions.Add(repaymentTransaction);
            _context.Loans.Update(loan);
            _context.Accounts.Update(account);

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return repaymentTransaction;
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// TODO Lấy thông tin loan theo userId
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="isCompleted"></param>
    /// <returns></returns>
    public async Task<IEnumerable<Loan>> GetUserLoansAsync(int userId, bool? isCompleted)
    {
        if (userId <= 0)
            throw new Exception("Người dùng không hợp lệ.");

        await RefreshOverdueLoansAsync(userId);

        var query = _context.Loans
            .AsNoTracking()
            .AsSplitQuery()
            .Include(l => l.Schedules.OrderBy(s => s.Period))
            .Include(l => l.Transactions.OrderByDescending(t => t.TransactionDate))
            .Where(l => l.UserId == userId);

        if (isCompleted.HasValue)
        {
            if (isCompleted.Value)
            {
                query = query.Where(l => l.Status == LoanStatus.Completed);
            }
            else
            {
                query = query.Where(l =>
                    l.Status == LoanStatus.Active ||
                    l.Status == LoanStatus.Overdue);
            }
        }
        else
        {
            query = query.Where(l => l.Status != LoanStatus.Cancelled);
        }
        return await query
            .OrderBy(l => l.Status == LoanStatus.Overdue ? 0 :
                        l.Status == LoanStatus.Active ? 1 :
                        l.Status == LoanStatus.Completed ? 2 : 3)
            .ThenBy(l => l.DueDate)
            .ThenByDescending(l => l.StartDate)
            .ToListAsync();
    }

    /// <summary>
    /// TODO Xem chi tiết khoản vay
    /// </summary>
    /// <param name="loanId"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<Loan?> GetLoanDetailsAsync(int loanId, int userId)
    {
        await RefreshOverdueLoansAsync(userId);
        return await _context.Loans
            .AsNoTracking()
            .AsSplitQuery()
            .Include(l => l.Transactions.OrderByDescending(t => t.TransactionDate))
            .Include(l => l.Schedules.OrderBy(s => s.Period))
            .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);
    }

    /// <summary>
    /// TODO Xoá khoản vay
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
                .Include(l => l.Schedules)
                .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);

            if (loan == null)
                throw new Exception("Khoản vay không tồn tại.");

            if (loan.Status == LoanStatus.Completed)
                throw new Exception("Không thể xoá khoản vay đã tất toán.");

            if (loan.Status == LoanStatus.Cancelled)
                throw new Exception("Khoản vay này đã bị huỷ.");

            var hasSchedulePayment = loan.Schedules.Any(HasAnyPayment);

            if (hasSchedulePayment)
                throw new Exception("Không thể xoá khoản vay đã phát sinh thanh toán.");


            var transactions = await _context.Transactions
                .Where(t => t.LoanId == loanId && t.UserId == userId)
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.Id)
                .ToListAsync();

            if (transactions.Count == 0)
                throw new Exception("Không tìm thấy giao dịch gốc của khoản vay");

            var repaymentTransactions = transactions
            .Where(t => t.Type == TransactionType.Income ||
                        t.Type == TransactionType.Expense)
            .ToList();

            if (repaymentTransactions.Any())
                throw new Exception("Không thể xoá khoản vay đã có giao dịch trả nợ.");

            var initialTransactions = transactions
                .Where(t => t.Type == TransactionType.Lend ||
                            t.Type == TransactionType.Borrow)
                .ToList();

            if (initialTransactions.Count == 0)
                throw new Exception("Không tìm thấy giao dịch giải ngân ban đầu của khoản vay.");

            if (initialTransactions.Count > 1)
                throw new Exception("Dữ liệu khoản vay không hợp lệ: có nhiều giao dịch giải ngân ban đầu.");

            var initialTransaction = initialTransactions.Single();

            await RollbackInitialLoanTransactionAsync(initialTransaction, userId);

            _context.Transactions.RemoveRange(transactions);

            if (loan.Schedules.Any())
                _context.RepaymentSchedules.RemoveRange(loan.Schedules);

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

    #region Validate + normalize + chọn giá trị
    /// <summary>
    /// !Validate request tạo loan
    /// </summary>
    /// <param name="request"></param>
    /// <exception cref="Exception"></exception>
    private static void ValidateCreateLoanRequest(LoanRequest request)
    {
        if (request.AccountId <= 0)
            throw new Exception("Tài khoản không hợp lệ.");

        if (string.IsNullOrWhiteSpace(request.Currency))
            throw new Exception("Đơn vị tiền tệ không hợp lệ.");

        if (string.IsNullOrWhiteSpace(request.CounterPartyName))
            throw new Exception("Tên đối tượng vay/cho vay không được để trống.");

        if (request.PrincipalAmount <= 0)
            throw new Exception("Số tiền vay/cho vay phải lớn hơn 0.");

        if (request.InterestRate < 0)
            throw new Exception("Lãi suất không hợp lệ.");

        if (request.Duration <= 0)
            throw new Exception("Kỳ hạn vay phải lớn hơn 0.");

        if (request.RepaymentMethod == RepaymentMethod.NoInterest &&
            request.InterestRate > 0)
        {
            throw new Exception("Khoản vay không lãi không được có lãi suất lớn hơn 0.");
        }

        if (request.PaymentDayOfMonth.HasValue &&
            (request.PaymentDayOfMonth.Value < 1 || request.PaymentDayOfMonth.Value > 31))
        {
            throw new Exception("Ngày trả nợ trong tháng phải nằm trong khoảng từ 1 đến 31.");
        }

        if (request.LateFeeRate.HasValue && request.LateFeeRate.Value < 0)
            throw new Exception("Phí/phạt trả chậm không hợp lệ.");

        if (request.PrepaymentFeeRate.HasValue && request.PrepaymentFeeRate.Value < 0)
            throw new Exception("Phí trả trước hạn không hợp lệ.");

        if (request.ReminderBeforeDays < 0)
            throw new Exception("Số ngày nhắc trước không hợp lệ.");
    }

    /// <summary>
    /// !Validate update loan
    /// </summary>
    /// <param name="request"></param>
    /// <exception cref="Exception"></exception>
    private static void ValidateUpdateLoanRequest(LoanUpdateRequest request)
    {
        if (request.CounterPartyName != null &&
            string.IsNullOrWhiteSpace(request.CounterPartyName))
        {
            throw new Exception("Tên đối tượng vay/cho vay không được để trống.");
        }

        if (request.InterestRate.HasValue && request.InterestRate.Value < 0)
            throw new Exception("Lãi suất không hợp lệ.");

        if (request.Duration.HasValue && request.Duration.Value <= 0)
            throw new Exception("Kỳ hạn vay phải lớn hơn 0.");

        if (request.PaymentDayOfMonth.HasValue &&
            (request.PaymentDayOfMonth.Value < 1 || request.PaymentDayOfMonth.Value > 31))
        {
            throw new Exception("Ngày trả nợ trong tháng phải nằm trong khoảng từ 1 đến 31.");
        }

        if (request.LateFeeRate.HasValue && request.LateFeeRate.Value < 0)
            throw new Exception("Phí/phạt trả chậm không hợp lệ.");

        if (request.PrepaymentFeeRate.HasValue && request.PrepaymentFeeRate.Value < 0)
            throw new Exception("Phí trả trước hạn không hợp lệ.");

        if (request.ReminderBeforeDays.HasValue && request.ReminderBeforeDays.Value < 0)
            throw new Exception("Số ngày nhắc trước không hợp lệ.");
    }

    /// <summary>
    /// !Validate repayment method và duration unit
    /// </summary>
    /// <param name="repaymentMethod"></param>
    /// <param name="durationUnit"></param>
    /// <exception cref="Exception"></exception>
    private static void ValidateRepaymentMethodWithDurationUnit(RepaymentMethod repaymentMethod, DurationUnit durationUnit)
    {
        if (durationUnit != DurationUnit.Day)
            return;

        var allowedForDayDuration =
            repaymentMethod == RepaymentMethod.NoInterest ||
            repaymentMethod == RepaymentMethod.SinglePayment;

        if (!allowedForDayDuration)
        {
            throw new Exception(
                "Kỳ hạn theo ngày chỉ hỗ trợ khoản vay không lãi hoặc trả một lần cuối kỳ."
            );
        }
    }

    /// <summary>
    /// !Chuẩn hoá currency
    /// </summary>
    /// <param name="currency"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    private static string NormalizeCurrency(string currency)
    {
        if (string.IsNullOrWhiteSpace(currency))
            throw new Exception("Đơn vị tiền tệ không hợp lệ.");

        return currency.Trim().ToUpperInvariant();
    }

    /// <summary>
    /// Chuẩn hoá ngày
    /// </summary>
    /// <param name="dateTime"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    private static DateTime NormalizeDateTime(DateTime dateTime)
    {
        if (dateTime == default)
            throw new Exception("Ngày bắt đầu vay không hợp lệ.");

        if (dateTime.Kind == DateTimeKind.Utc)
            return dateTime;

        if (dateTime.Kind == DateTimeKind.Local)
            return dateTime.ToUniversalTime();

        return DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
    }

    /// <summary>
    /// !Chuẩn hoá kỳ hạn về tháng
    /// </summary>
    /// <param name="duration"></param>
    /// <param name="durationUnit"></param>
    /// <returns></returns>
    private static int ResolveDurationMonths(int duration, DurationUnit durationUnit)
    {
        if (duration <= 0)
            throw new Exception("Kỳ hạn vay phải lớn hơn 0.");

        var unit = durationUnit;
        return unit switch
        {
            DurationUnit.Month => duration,
            DurationUnit.Year => duration * 12,
            DurationUnit.Day => 1,
            _ => throw new Exception("Đơn vị kỳ hạn không hợp lệ.")
        };
    }

    /// <summary>
    /// Hàm tính dueDate
    /// </summary>
    /// <param name="startDate"></param>
    /// <param name="duration"></param>
    /// <param name="durationUnit"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    private static DateTime CalculateDueDate(DateTime startDate, int duration, DurationUnit durationUnit)
    {
        if (duration <= 0)
            throw new Exception("Kỳ hạn vay phải lớn hơn 0.");

        return durationUnit switch
        {
            DurationUnit.Day => startDate.AddDays(duration),
            DurationUnit.Month => startDate.AddMonths(duration),
            DurationUnit.Year => startDate.AddYears(duration),
            _ => throw new Exception("Đơn vị kỳ hạn không hợp lệ.")
        };
    }

    /// <summary>
    /// !Tính ngày nhắc nợ tiếp theo
    /// </summary>
    /// <param name="dueDate"></param>
    /// <param name="isRecurringReminder"></param>
    /// <param name="reminderBeforeDays"></param>
    /// <returns></returns>
    private DateTime? CalculateNextReminderDate(DateTime dueDate, bool isRecurringReminder, int reminderBeforeDays)
    {
        if (!isRecurringReminder) return null;

        if (reminderBeforeDays < 0)
            throw new Exception("Số ngày nhắc trước không hợp lệ.");

        return dueDate.AddDays(-reminderBeforeDays);
    }

    /// <summary>
    /// Hàm chọn thứ tự ưu tiên trả nợ
    /// </summary>
    /// <param name="counterPartyType"></param>
    /// <param name="requestedStrategy"></param>
    /// <returns></returns>
    private static PaymentAllocationStrategy ResolveAllocationStrategy(LoanCounterPartyType counterPartyType, PaymentAllocationStrategy? requestedStrategy)
    {
        if (requestedStrategy.HasValue)
            return requestedStrategy.Value;

        return counterPartyType switch
        {
            LoanCounterPartyType.Bank => PaymentAllocationStrategy.FeePenaltyInterestPrincipal,
            LoanCounterPartyType.Merchant => PaymentAllocationStrategy.FeePenaltyInterestPrincipal,
            _ => PaymentAllocationStrategy.InterestPrincipal
        };
    }

    /// <summary>
    /// !Validate loan tránh regenerate lịch sai
    /// </summary>
    /// <param name="loan"></param>
    /// <exception cref="Exception"></exception>
    private static void ValidateLoanForScheduleGeneration(Loan loan)
    {
        if (loan.PrincipalAmount <= 0)
            throw new Exception("Số tiền gốc phải lớn hơn 0.");

        if (loan.RemainingPrincipalAmount <= 0)
            throw new Exception("Dư nợ gốc còn lại không hợp lệ.");

        if (loan.InterestRate < 0)
            throw new Exception("Lãi suất không hợp lệ.");

        if (loan.Duration <= 0)
            throw new Exception("Kỳ hạn vay phải lớn hơn 0.");

        if (loan.PaymentDayOfMonth.HasValue &&
            (loan.PaymentDayOfMonth.Value < 1 || loan.PaymentDayOfMonth.Value > 31))
        {
            throw new Exception("Ngày trả nợ trong tháng phải nằm trong khoảng từ 1 đến 31.");
        }

        ValidateRepaymentMethodWithDurationUnit(
            loan.RepaymentMethod,
            loan.DurationUnit
        );

        if (loan.RepaymentMethod == RepaymentMethod.NoInterest &&
            loan.InterestRate > 0)
        {
            throw new Exception("Khoản vay không lãi không được có lãi suất lớn hơn 0.");
        }
    }

    /// <summary>
    /// !Validate request repayment
    /// </summary>
    /// <param name="request"></param>
    /// <exception cref="Exception"></exception>
    private static void ValidateRepaymentRequest(RepaymentRequest request)
    {
        if (request.LoanId <= 0)
            throw new Exception("Khoản vay không hợp lệ.");

        if (request.AccountId <= 0)
            throw new Exception("Tài khoản thanh toán không hợp lệ.");

        if (request.Amount <= 0)
            throw new Exception("Số tiền thanh toán phải lớn hơn 0.");

        if (request.Period.HasValue && request.Period.Value <= 0)
            throw new Exception("Kỳ thanh toán không hợp lệ.");
    }
    #endregion

    #region Helper 
    /// <summary>
    ///! Check xem tài khoản có hợp lệ không
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
    /// !Tính lãi ngày
    /// </summary>
    /// <param name="startDate"></param>
    /// <param name="endDate"></param>
    /// <returns></returns>
    private static int CalculateInterestDays(DateTime startDate, DateTime endDate)
    {
        var days = (endDate.Date - startDate.Date).Days;

        return Math.Max(days, 1);
    }

    /// <summary>
    /// !Làm tròn tiền
    /// </summary>
    /// <param name="value"></param>
    /// <returns></returns>
    private static decimal RoundMoney(decimal value)
    {
        return Math.Round(value, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// !Hàm mũ
    /// </summary>
    /// <param name="value"></param>
    /// <param name="exponent"></param>
    /// <returns></returns>
    private static decimal Pow(decimal value, int exponent)
    {
        return (decimal)Math.Pow((double)value, exponent);
    }

    /// <summary>
    /// !Kiểm tra field nào ảnh hưởng đến schedule
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="request"></param>
    /// <returns></returns>
    private static bool HasScheduleAffectingChange(Loan loan, LoanUpdateRequest request)
    {
        if (request.CounterPartyType.HasValue &&
            loan.CounterPartyType != request.CounterPartyType.Value)
            return true;

        if (request.InterestRate.HasValue &&
            loan.InterestRate != request.InterestRate.Value)
            return true;

        if (request.InterestUnit.HasValue &&
            loan.InterestUnit != request.InterestUnit.Value)
            return true;

        if (request.Duration.HasValue &&
            loan.Duration != request.Duration.Value)
            return true;

        if (request.DurationUnit.HasValue &&
            loan.DurationUnit != request.DurationUnit.Value)
            return true;

        if (request.StartDate.HasValue &&
            loan.StartDate != NormalizeDateTime(request.StartDate.Value))
            return true;

        if (request.RepaymentMethod.HasValue &&
            loan.RepaymentMethod != request.RepaymentMethod.Value)
            return true;

        if (request.PrepaymentPolicy.HasValue &&
            loan.PrepaymentPolicy != request.PrepaymentPolicy.Value)
            return true;

        if (request.PaymentDayOfMonth.HasValue &&
            loan.PaymentDayOfMonth != request.PaymentDayOfMonth.Value)
            return true;

        if (request.IsInterestAccruedDaily.HasValue &&
            loan.IsInterestAccruedDaily != request.IsInterestAccruedDaily.Value)
            return true;

        return false;
    }

    /// <summary>
    /// !Các field có thể update không ảnh hưởng đến schedule
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="request"></param>
    private static void ApplyCommonLoanUpdates(Loan loan, LoanUpdateRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.CounterPartyName))
            loan.CounterPartyName = request.CounterPartyName.Trim();

        if (request.Note != null)
            loan.Note = request.Note.Trim();

        if (request.AllocationStrategy.HasValue)
            loan.AllocationStrategy = request.AllocationStrategy.Value;

        if (request.LateFeeRate.HasValue)
            loan.LateFeeRate = request.LateFeeRate.Value;

        if (request.PrepaymentFeeRate.HasValue)
            loan.PrepaymentFeeRate = request.PrepaymentFeeRate.Value;

        if (request.IsRecurringReminder.HasValue)
            loan.IsRecurringReminder = request.IsRecurringReminder.Value;

        if (request.ReminderBeforeDays.HasValue)
            loan.ReminderBeforeDays = request.ReminderBeforeDays.Value;

        if (request.ReminderFrequency.HasValue)
            loan.ReminderFrequency = request.ReminderFrequency.Value;
    }

    /// <summary>
    /// !Kiểm tra schedule đã có thanh toán chưa?
    /// </summary>
    /// <param name="schedule"></param>
    /// <returns></returns>
    private static bool HasAnyPayment(RepaymentSchedule schedule)
    {
        return schedule.PaidTotalAmount > 0 ||
               schedule.PaidPrincipalAmount > 0 ||
               schedule.PaidInterestAmount > 0 ||
               schedule.PaidFeeAmount > 0 ||
               schedule.PaidPenaltyAmount > 0 ||
               schedule.Status == RepaymentScheduleStatus.PartiallyPaid ||
               schedule.Status == RepaymentScheduleStatus.Paid;
    }

    /// <summary>
    /// Rollback giao dịch gốc
    /// </summary>
    /// <param name="transaction"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    private async Task RollbackInitialLoanTransactionAsync(Transaction transaction, int userId)
    {
        if (transaction.Type != TransactionType.Lend &&
            transaction.Type != TransactionType.Borrow)
        {
            throw new Exception("Giao dịch cần hoàn tác không phải giao dịch gốc của khoản vay.");
        }

        var accountId = transaction.FromAccountId ?? transaction.ToAccountId;

        if (!accountId.HasValue)
            throw new Exception("Giao dịch gốc không có tài khoản hợp lệ.");

        var account = await GetOwnedAccountAsync(accountId.Value, userId);

        var amountInAccountCurrency = transaction.ConvertedAmount ?? transaction.Amount;

        if (amountInAccountCurrency <= 0)
            throw new Exception("Số tiền giao dịch gốc không hợp lệ.");

        switch (transaction.Type)
        {
            case TransactionType.Lend:
                // Khi tạo khoản cho vay: ví đã bị trừ tiền.
                // Khi xoá khoản vay: cộng tiền lại vào ví.
                account.Balance += amountInAccountCurrency;
                break;

            case TransactionType.Borrow:
                // Khi tạo khoản đi vay: ví đã được cộng tiền.
                // Khi xoá khoản vay: trừ tiền khỏi ví.
                if (account.Balance < amountInAccountCurrency)
                {
                    throw new Exception("Không thể xoá khoản vay vì số dư hiện tại không đủ để hoàn tác giao dịch đi vay.");
                }

                account.Balance -= amountInAccountCurrency;
                break;

            default:
                throw new Exception($"Loại giao dịch không hợp lệ khi xoá khoản vay: {transaction.Type}");
        }

        _context.Accounts.Update(account);
    }
    #endregion

    #region Build schedules

    /// <summary>
    /// !Tạo kế hoạch trả nợ tuỳ vào loại lãi suất và kỳ hạn đã chọn
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="durationMonths"></param>
    /// <returns></returns>
    private void GenerateRepaymentSchedules(Loan loan, int durationMonths)
    {
        switch (loan.RepaymentMethod)
        {
            case RepaymentMethod.NoInterest:
                GenerateNoInterestSchedule(loan);
                break;

            case RepaymentMethod.SinglePayment:
                GenerateSinglePaymentSchedule(loan, durationMonths);
                break;

            case RepaymentMethod.FlatRateInstallment:
                GenerateFlatRateInstallmentSchedule(loan, durationMonths);
                break;

            case RepaymentMethod.EqualPrincipal:
                GenerateEqualPrincipalSchedule(loan, durationMonths);
                break;

            case RepaymentMethod.EqualPayment:
                GenerateEqualPaymentSchedule(loan, durationMonths);
                break;

            case RepaymentMethod.InterestOnly:
                GenerateInterestOnlySchedule(loan, durationMonths);
                break;

            default:
                throw new Exception("Phương thức trả nợ không hợp lệ.");
        }
    }

    /// <summary>
    /// !Build schedule khi không có lãi
    /// </summary>
    /// <param name="loan"></param>
    private void GenerateNoInterestSchedule(Loan loan)
    {
        var periodStart = loan.StartDate;
        var periodEnd = loan.DueDate;

        var schedule = CreateSchedule(
            loan: loan,
            period: 1,
            periodStart: periodStart,
            periodEnd: periodEnd,
            openingPrincipal: loan.PrincipalAmount,
            principal: loan.PrincipalAmount,
            interest: 0,
            fee: 0,
            penalty: 0
        );

        _context.RepaymentSchedules.Add(schedule);
    }

    /// <summary>
    /// !Trả 1 lần cuối kỳ
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="durationMonths"></param>
    private void GenerateSinglePaymentSchedule(Loan loan, int durationMonths)
    {
        var periodStart = loan.StartDate;
        var periodEnd = loan.DueDate;

        var interest = CalculateSinglePaymentInterest(
            loan,
            loan.PrincipalAmount,
            periodStart,
            periodEnd,
            durationMonths
        );

        var schedule = CreateSchedule(
            loan: loan,
            period: 1,
            periodStart: periodStart,
            periodEnd: periodEnd,
            openingPrincipal: loan.PrincipalAmount,
            principal: loan.PrincipalAmount,
            interest: interest,
            fee: 0,
            penalty: 0
        );

        _context.RepaymentSchedules.Add(schedule);
    }

    /// <summary>
    /// !Trả góp lãi phẳng
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="durationMonths"></param>
    private void GenerateFlatRateInstallmentSchedule(Loan loan, int durationMonths)
    {
        var monthlyPrincipal = RoundMoney(loan.PrincipalAmount / durationMonths);
        var remaining = loan.PrincipalAmount;

        var previousPeriodEnd = loan.StartDate;

        for (int period = 1; period <= durationMonths; period++)
        {
            var periodStart = previousPeriodEnd;
            var periodEnd = GetPeriodEndDate(loan, period);

            var openingPrincipal = remaining;

            var principal = period == durationMonths
                ? openingPrincipal
                : monthlyPrincipal;

            var interest = CalculateFlatRateInterestForPeriod(
                loan,
                loan.PrincipalAmount,
                periodStart,
                periodEnd
            );

            var schedule = CreateSchedule(
                loan: loan,
                period: period,
                periodStart: periodStart,
                periodEnd: periodEnd,
                openingPrincipal: openingPrincipal,
                principal: principal,
                interest: interest,
                fee: 0,
                penalty: 0
            );

            _context.RepaymentSchedules.Add(schedule);

            remaining = schedule.ClosingPrincipalBalance;
            previousPeriodEnd = periodEnd;
        }
    }

    /// <summary>
    /// !Gốc đều, lãi dư nợ giảm dần
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="durationMonths"></param>
    private void GenerateEqualPrincipalSchedule(Loan loan, int durationMonths)
    {
        var monthlyPrincipal = RoundMoney(loan.PrincipalAmount / durationMonths);
        var remaining = loan.PrincipalAmount;

        var previousPeriodEnd = loan.StartDate;

        for (int period = 1; period <= durationMonths; period++)
        {
            var periodStart = previousPeriodEnd;
            var periodEnd = GetPeriodEndDate(loan, period);

            var openingPrincipal = remaining;

            var principal = period == durationMonths
                ? openingPrincipal
                : monthlyPrincipal;

            var interest = CalculateInterestForPeriod(
                loan,
                openingPrincipal,
                periodStart,
                periodEnd
            );

            var schedule = CreateSchedule(
                loan: loan,
                period: period,
                periodStart: periodStart,
                periodEnd: periodEnd,
                openingPrincipal: openingPrincipal,
                principal: principal,
                interest: interest,
                fee: 0,
                penalty: 0
            );

            _context.RepaymentSchedules.Add(schedule);

            remaining = schedule.ClosingPrincipalBalance;
            previousPeriodEnd = periodEnd;
        }
    }

    /// <summary>
    /// !Trả góp đều (mỗi tháng 1 số tiền)
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="durationMonths"></param>
    /// <exception cref="Exception"></exception>
    private void GenerateEqualPaymentSchedule(Loan loan, int durationMonths)
    {
        var periodRate = GetMonthlyRate(loan);
        var remaining = loan.PrincipalAmount;

        decimal fixedPayment;

        if (periodRate == 0)
        {
            fixedPayment = RoundMoney(loan.PrincipalAmount / durationMonths);
        }
        else
        {
            var factor = Pow(1 + periodRate, durationMonths);

            fixedPayment = RoundMoney(
                loan.PrincipalAmount * periodRate * factor / (factor - 1)
            );
        }

        var previousPeriodEnd = loan.StartDate;

        for (int period = 1; period <= durationMonths; period++)
        {
            var periodStart = previousPeriodEnd;
            var periodEnd = GetPeriodEndDate(loan, period);

            var openingPrincipal = remaining;

            var interest = CalculateInterestForPeriod(
                loan,
                openingPrincipal,
                periodStart,
                periodEnd
            );

            decimal principal;

            if (period == durationMonths)
            {
                principal = openingPrincipal;
                fixedPayment = principal + interest;
            }
            else
            {
                principal = fixedPayment - interest;

                if (principal <= 0)
                    throw new Exception("Tiền trả mỗi kỳ không đủ để thanh toán phần lãi.");
            }

            var schedule = CreateSchedule(
                loan: loan,
                period: period,
                periodStart: periodStart,
                periodEnd: periodEnd,
                openingPrincipal: openingPrincipal,
                principal: principal,
                interest: interest,
                fee: 0,
                penalty: 0
            );

            _context.RepaymentSchedules.Add(schedule);

            remaining = schedule.ClosingPrincipalBalance;
            previousPeriodEnd = periodEnd;
        }
    }

    /// <summary>
    /// !Trả lãi hằng tháng, cuối kỳ trả gốc
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="durationMonths"></param>
    private void GenerateInterestOnlySchedule(Loan loan, int durationMonths)
    {
        var remaining = loan.PrincipalAmount;
        var previousPeriodEnd = loan.StartDate;

        for (int period = 1; period <= durationMonths; period++)
        {
            var periodStart = previousPeriodEnd;
            var periodEnd = GetPeriodEndDate(loan, period);

            var openingPrincipal = remaining;

            var principal = period == durationMonths
                ? openingPrincipal
                : 0;

            var interest = CalculateInterestForPeriod(
                loan,
                openingPrincipal,
                periodStart,
                periodEnd
            );

            var schedule = CreateSchedule(
                loan: loan,
                period: period,
                periodStart: periodStart,
                periodEnd: periodEnd,
                openingPrincipal: openingPrincipal,
                principal: principal,
                interest: interest,
                fee: 0,
                penalty: 0
            );

            _context.RepaymentSchedules.Add(schedule);

            remaining = schedule.ClosingPrincipalBalance;
            previousPeriodEnd = periodEnd;
        }
    }

    /// <summary>
    /// !Hàm tạo 1 dòng schedule
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="period"></param>
    /// <param name="periodStart"></param>
    /// <param name="periodEnd"></param>
    /// <param name="openingPrincipal"></param>
    /// <param name="principal"></param>
    /// <param name="interest"></param>
    /// <param name="fee"></param>
    /// <param name="penalty"></param>
    /// <returns></returns>
    private static RepaymentSchedule CreateSchedule(Loan loan, int period, DateTime periodStart, DateTime periodEnd, decimal openingPrincipal, decimal principal, decimal interest, decimal fee, decimal penalty)
    {
        openingPrincipal = RoundMoney(openingPrincipal);
        principal = RoundMoney(principal);
        interest = RoundMoney(interest);
        fee = RoundMoney(fee);
        penalty = RoundMoney(penalty);

        if (principal > openingPrincipal)
            principal = openingPrincipal;

        var closingPrincipal = RoundMoney(openingPrincipal - principal);

        if (closingPrincipal < 0)
            closingPrincipal = 0;

        var totalAmount = RoundMoney(principal + interest + fee + penalty);

        return new RepaymentSchedule
        {
            LoanId = loan.Id,
            Period = period,

            PeriodStartDate = periodStart,
            PeriodEndDate = periodEnd,
            InterestDays = CalculateInterestDays(periodStart, periodEnd),

            OpeningPrincipalBalance = openingPrincipal,

            PrincipalAmount = principal,
            InterestAmount = interest,
            FeeAmount = fee,
            PenaltyAmount = penalty,

            TotalAmount = totalAmount,

            ClosingPrincipalBalance = closingPrincipal,

            DueDate = periodEnd,

            Status = RepaymentScheduleStatus.Pending,
            IsPaid = false,
            PaidDate = null,

            PaidPrincipalAmount = 0,
            PaidInterestAmount = 0,
            PaidFeeAmount = 0,
            PaidPenaltyAmount = 0,
            PaidTotalAmount = 0
        };
    }

    /// <summary>
    /// !Tính ngày kết thúc kỳ
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="period"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    private static DateTime GetPeriodEndDate(Loan loan, int period)
    {
        if (period <= 0)
            throw new Exception("Kỳ trả nợ không hợp lệ.");

        if (loan.PaymentDayOfMonth.HasValue)
        {
            return GetMonthlyDueDate(
                loan.StartDate,
                period,
                loan.PaymentDayOfMonth.Value
            );
        }

        return loan.StartDate.AddMonths(period);
    }

    /// <summary>
    /// !Ngày trả nợ theo ngày trong tháng 
    /// </summary>
    /// <param name="startDate"></param>
    /// <param name="period"></param>
    /// <param name="paymentDayOfMonth"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    private static DateTime GetMonthlyDueDate(DateTime startDate, int period, int paymentDayOfMonth)
    {
        if (paymentDayOfMonth < 1 || paymentDayOfMonth > 31)
            throw new Exception("Ngày trả nợ trong tháng phải từ 1 đến 31.");

        var targetMonth = startDate.AddMonths(period);

        var day = Math.Min(paymentDayOfMonth, DateTime.DaysInMonth(targetMonth.Year, targetMonth.Month));

        return new DateTime(
            targetMonth.Year,
            targetMonth.Month,
            day,
            startDate.Hour,
            startDate.Minute,
            startDate.Second,
            startDate.Kind
        );
    }
    #endregion

    #region Update schedule
    /// <summary>
    /// !Update schedules
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="request"></param>
    private static void ApplyScheduleAffectingLoanUpdates(Loan loan, LoanUpdateRequest request)
    {
        if (request.CounterPartyType.HasValue)
            loan.CounterPartyType = request.CounterPartyType.Value;

        if (request.InterestRate.HasValue)
            loan.InterestRate = request.InterestRate.Value;

        if (request.InterestUnit.HasValue)
            loan.InterestUnit = request.InterestUnit.Value;

        if (request.Duration.HasValue)
            loan.Duration = request.Duration.Value;

        if (request.DurationUnit.HasValue)
            loan.DurationUnit = request.DurationUnit.Value;

        if (request.StartDate.HasValue)
            loan.StartDate = NormalizeDateTime(request.StartDate.Value);

        if (request.RepaymentMethod.HasValue)
            loan.RepaymentMethod = request.RepaymentMethod.Value;

        if (request.PrepaymentPolicy.HasValue)
            loan.PrepaymentPolicy = request.PrepaymentPolicy.Value;

        if (request.PaymentDayOfMonth.HasValue)
            loan.PaymentDayOfMonth = request.PaymentDayOfMonth.Value;

        if (request.IsInterestAccruedDaily.HasValue)
            loan.IsInterestAccruedDaily = request.IsInterestAccruedDaily.Value;

        if (loan.RepaymentMethod == RepaymentMethod.NoInterest)
            loan.InterestRate = 0;

        if (!request.AllocationStrategy.HasValue)
        {
            loan.AllocationStrategy = ResolveAllocationStrategy(
                loan.CounterPartyType,
                null
            );
        }
    }

    /// <summary>
    /// !Phân bổ tiền vào các kỳ
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="period"></param>
    /// <param name="totalPaid"></param>
    /// <param name="paidDate"></param>
    /// <returns></returns>
    private PaymentAllocationResult ApplyPaymentToSchedules(Loan loan, int? period, decimal totalPaid, DateTime paidDate)
    {
        var result = new PaymentAllocationResult();

        var schedules = BuildRepaymentTargets(loan, period);

        if (!schedules.Any())
        {
            result.UnappliedAmount = totalPaid;
            return result;
        }

        var remainingPayment = totalPaid;

        foreach (var schedule in schedules)
        {
            if (remainingPayment <= 0)
                break;

            var applied = ApplyPaymentToSingleSchedule(
                loan.AllocationStrategy,
                schedule,
                remainingPayment
            );

            remainingPayment = RoundMoney(remainingPayment - applied.TotalPaid);

            result.FeePaid += applied.FeePaid;
            result.PenaltyPaid += applied.PenaltyPaid;
            result.InterestPaid += applied.InterestPaid;
            result.PrincipalPaid += applied.PrincipalPaid;
            result.TotalPaid += applied.TotalPaid;

            UpdateSchedulePaymentStatus(schedule, paidDate);
        }

        result.FeePaid = RoundMoney(result.FeePaid);
        result.PenaltyPaid = RoundMoney(result.PenaltyPaid);
        result.InterestPaid = RoundMoney(result.InterestPaid);
        result.PrincipalPaid = RoundMoney(result.PrincipalPaid);
        result.TotalPaid = RoundMoney(result.TotalPaid);
        result.UnappliedAmount = RoundMoney(remainingPayment);

        return result;
    }

    /// <summary>
    /// !Chọn các kỳ được thanh toán
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="period"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    private static List<RepaymentSchedule> BuildRepaymentTargets(Loan loan, int? period)
    {
        var unpaidSchedules = loan.Schedules
            .Where(s => s.Status != RepaymentScheduleStatus.Cancelled)
            .Where(s => s.UnpaidAmount > 0)
            .OrderBy(s => s.Period)
            .ToList();

        if (!unpaidSchedules.Any())
            return new List<RepaymentSchedule>();

        var firstUnpaidSchedule = unpaidSchedules.First();

        if (period.HasValue)
        {
            var selectedSchedule = unpaidSchedules
                .FirstOrDefault(s => s.Period == period.Value);

            if (selectedSchedule == null)
                throw new Exception("Kỳ thanh toán không tồn tại hoặc đã được thanh toán đủ.");

            // Chặn không cho trả kỳ sau mà kỳ trước chưa trả
            if (selectedSchedule.Period != firstUnpaidSchedule.Period)
            {
                throw new Exception(
                    $"Vui lòng thanh toán kỳ {firstUnpaidSchedule.Period} trước khi thanh toán kỳ {selectedSchedule.Period}."
                );
            }

            if (loan.PrepaymentPolicy == PrepaymentPolicy.AllowAndRecalculateSchedule)
            {
                throw new Exception("Chức năng trả trước và tính lại lịch trả nợ chưa được hỗ trợ.");
            }

            if (loan.PrepaymentPolicy == PrepaymentPolicy.AllowWithoutRecalculation)
            {
                return unpaidSchedules
                    .Where(s => s.Period >= selectedSchedule.Period)
                    .OrderBy(s => s.Period)
                    .ToList();
            }

            return new List<RepaymentSchedule> { selectedSchedule };
        }

        if (loan.PrepaymentPolicy == PrepaymentPolicy.NotAllowed)
        {
            return new List<RepaymentSchedule> { firstUnpaidSchedule };
        }

        return unpaidSchedules;
    }

    /// <summary>
    /// !Cập nhật trạng thái từng kỳ
    /// </summary>
    /// <param name="schedule"></param>
    /// <param name="paidDate"></param>
    private static void UpdateSchedulePaymentStatus(RepaymentSchedule schedule, DateTime paidDate)
    {
        schedule.PaidTotalAmount = RoundMoney(
            schedule.PaidPrincipalAmount +
            schedule.PaidInterestAmount +
            schedule.PaidFeeAmount +
            schedule.PaidPenaltyAmount
        );

        if (schedule.UnpaidAmount <= 0)
        {
            schedule.IsPaid = true;
            schedule.PaidDate = paidDate;
            schedule.Status = RepaymentScheduleStatus.Paid;
            return;
        }

        if (schedule.PaidTotalAmount > 0)
        {
            schedule.IsPaid = false;
            schedule.PaidDate = null;

            schedule.Status = paidDate.Date > schedule.DueDate.Date
                ? RepaymentScheduleStatus.Overdue
                : RepaymentScheduleStatus.PartiallyPaid;

            return;
        }

        schedule.IsPaid = false;
        schedule.PaidDate = null;

        schedule.Status = paidDate.Date > schedule.DueDate.Date
            ? RepaymentScheduleStatus.Overdue
            : RepaymentScheduleStatus.Pending;
    }

    /// <summary>
    /// !Cập nhật trạng thái khoản vay
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="transactionDate"></param>
    private static void UpdateLoanStatusAfterRepayment(Loan loan, DateTime transactionDate)
    {
        var hasUnpaidSchedule = loan.Schedules.Any(s =>
            s.Status != RepaymentScheduleStatus.Cancelled &&
            s.UnpaidAmount > 0
        );

        if (loan.RemainingPrincipalAmount <= 0 && !hasUnpaidSchedule)
        {
            loan.RemainingPrincipalAmount = 0;
            loan.Status = LoanStatus.Completed;
            loan.IsRecurringReminder = false;
            loan.NextReminderDate = null;
            return;
        }

        var today = DateTime.UtcNow.Date;
        var hasOverdueSchedule = loan.Schedules.Any(s =>
            s.Status != RepaymentScheduleStatus.Cancelled &&
            s.UnpaidAmount > 0 &&
            s.DueDate.Date < today
        );

        loan.Status = hasOverdueSchedule
            ? LoanStatus.Overdue
            : LoanStatus.Active;
    }
    #endregion
    #region Phân bổ tiền vào kỳ

    /// <summary>
    /// !Phân bổ tiền vào một kỳ
    /// </summary>
    /// <param name="strategy"></param>
    /// <param name="schedule"></param>
    /// <param name="availableAmount"></param>
    /// <returns></returns>
    private static PaymentAllocationResult ApplyPaymentToSingleSchedule(PaymentAllocationStrategy strategy, RepaymentSchedule schedule, decimal availableAmount)
    {
        var result = new PaymentAllocationResult();

        if (availableAmount <= 0)
            return result;

        switch (strategy)
        {
            case PaymentAllocationStrategy.FeePenaltyInterestPrincipal:
                ApplyFee(schedule, result, ref availableAmount);
                ApplyPenalty(schedule, result, ref availableAmount);
                ApplyInterest(schedule, result, ref availableAmount);
                ApplyPrincipal(schedule, result, ref availableAmount);
                break;

            case PaymentAllocationStrategy.PrincipalInterest:
                ApplyPrincipal(schedule, result, ref availableAmount);
                ApplyInterest(schedule, result, ref availableAmount);
                ApplyFee(schedule, result, ref availableAmount);
                ApplyPenalty(schedule, result, ref availableAmount);
                break;

            case PaymentAllocationStrategy.InterestPrincipal:
            default:
                ApplyInterest(schedule, result, ref availableAmount);
                ApplyPrincipal(schedule, result, ref availableAmount);
                ApplyFee(schedule, result, ref availableAmount);
                ApplyPenalty(schedule, result, ref availableAmount);
                break;
        }

        result.TotalPaid = RoundMoney(
            result.FeePaid +
            result.PenaltyPaid +
            result.InterestPaid +
            result.PrincipalPaid
        );

        return result;
    }

    /// <summary>
    /// !Hàm apply phí
    /// </summary>
    /// <param name="schedule"></param>
    /// <param name="result"></param>
    /// <param name="availableAmount"></param>
    private static void ApplyFee(RepaymentSchedule schedule, PaymentAllocationResult result, ref decimal availableAmount)
    {
        var unpaid = schedule.UnpaidFeeAmount;

        if (unpaid <= 0 || availableAmount <= 0)
            return;

        var applied = Math.Min(availableAmount, unpaid);

        schedule.PaidFeeAmount = RoundMoney(schedule.PaidFeeAmount + applied);
        result.FeePaid = RoundMoney(result.FeePaid + applied);
        availableAmount = RoundMoney(availableAmount - applied);
    }

    /// <summary>
    /// !Apply tiền phạt
    /// </summary>
    /// <param name="schedule"></param>
    /// <param name="result"></param>
    /// <param name="availableAmount"></param>
    private static void ApplyPenalty(RepaymentSchedule schedule, PaymentAllocationResult result, ref decimal availableAmount)
    {
        var unpaid = schedule.UnpaidPenaltyAmount;

        if (unpaid <= 0 || availableAmount <= 0)
            return;

        var applied = Math.Min(availableAmount, unpaid);

        schedule.PaidPenaltyAmount = RoundMoney(schedule.PaidPenaltyAmount + applied);
        result.PenaltyPaid = RoundMoney(result.PenaltyPaid + applied);
        availableAmount = RoundMoney(availableAmount - applied);
    }

    /// <summary>
    /// !Apply lãi
    /// </summary>
    /// <param name="schedule"></param>
    /// <param name="result"></param>
    /// <param name="availableAmount"></param>
    private static void ApplyInterest(RepaymentSchedule schedule, PaymentAllocationResult result, ref decimal availableAmount)
    {
        var unpaid = schedule.UnpaidInterestAmount;

        if (unpaid <= 0 || availableAmount <= 0)
            return;

        var applied = Math.Min(availableAmount, unpaid);

        schedule.PaidInterestAmount = RoundMoney(schedule.PaidInterestAmount + applied);
        result.InterestPaid = RoundMoney(result.InterestPaid + applied);
        availableAmount = RoundMoney(availableAmount - applied);
    }

    /// <summary>
    /// !Apply tiền gốc
    /// </summary>
    /// <param name="schedule"></param>
    /// <param name="result"></param>
    /// <param name="availableAmount"></param>
    private static void ApplyPrincipal(RepaymentSchedule schedule, PaymentAllocationResult result, ref decimal availableAmount)
    {
        var unpaid = schedule.UnpaidPrincipalAmount;

        if (unpaid <= 0 || availableAmount <= 0)
            return;

        var applied = Math.Min(availableAmount, unpaid);

        schedule.PaidPrincipalAmount = RoundMoney(schedule.PaidPrincipalAmount + applied);
        result.PrincipalPaid = RoundMoney(result.PrincipalPaid + applied);
        availableAmount = RoundMoney(availableAmount - applied);
    }
    #endregion
    #region Tính lãi
    /// <summary>
    /// !Tính lãi theo kỳ
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="openingPrincipal"></param>
    /// <param name="periodStart"></param>
    /// <param name="periodEnd"></param>
    /// <returns></returns>
    private static decimal CalculateInterestForPeriod(Loan loan, decimal openingPrincipal, DateTime periodStart, DateTime periodEnd)
    {
        if (loan.RepaymentMethod == RepaymentMethod.NoInterest ||
            loan.InterestRate == 0)
        {
            return 0;
        }

        if (loan.IsInterestAccruedDaily)
        {
            var days = CalculateInterestDays(periodStart, periodEnd);
            var dailyRate = GetDailyRate(loan);

            return RoundMoney(openingPrincipal * dailyRate * days);
        }

        var monthlyRate = GetMonthlyRate(loan);

        return RoundMoney(openingPrincipal * monthlyRate);
    }

    /// <summary>
    /// Tính lãi phẳng
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="originalPrincipal"></param>
    /// <param name="periodStart"></param>
    /// <param name="periodEnd"></param>
    /// <returns></returns>
    private static decimal CalculateFlatRateInterestForPeriod(Loan loan, decimal originalPrincipal, DateTime periodStart, DateTime periodEnd)
    {
        if (loan.InterestRate == 0)
            return 0;

        if (loan.IsInterestAccruedDaily)
        {
            var days = CalculateInterestDays(periodStart, periodEnd);
            var dailyRate = GetDailyRate(loan);

            return RoundMoney(originalPrincipal * dailyRate * days);
        }

        var monthlyRate = GetMonthlyRate(loan);

        return RoundMoney(originalPrincipal * monthlyRate);
    }
    /// <summary>
    /// !Tính lãi cho SinglePayment
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="principal"></param>
    /// <param name="periodStart"></param>
    /// <param name="periodEnd"></param>
    /// <param name="durationMonths"></param>
    /// <returns></returns>
    private static decimal CalculateSinglePaymentInterest(Loan loan, decimal principal, DateTime periodStart, DateTime periodEnd, int durationMonths)
    {
        if (loan.RepaymentMethod == RepaymentMethod.NoInterest || loan.InterestRate == 0)
        {
            return 0;
        }

        if (loan.IsInterestAccruedDaily || loan.DurationUnit == DurationUnit.Day)
        {
            var days = CalculateInterestDays(periodStart, periodEnd);
            var dailyRate = GetDailyRate(loan);

            return RoundMoney(principal * dailyRate * days);
        }

        var monthlyRate = GetMonthlyRate(loan);

        return RoundMoney(principal * monthlyRate * durationMonths);
    }


    #endregion

    #region Quy đổi lãi suất
    /// <summary>
    /// !Lãi suất tháng
    /// </summary>
    /// <param name="loan"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    private static decimal GetMonthlyRate(Loan loan)
    {
        var rate = loan.InterestRate / 100m;

        return loan.InterestUnit switch
        {
            InterestUnit.PercentPerYear => rate / 12m,
            InterestUnit.PercentPerMonth => rate,
            InterestUnit.PercentPerDay => rate * 30m,
            _ => throw new Exception("Đơn vị lãi suất không hợp lệ.")
        };
    }

    /// <summary>
    /// !Lãi suất ngày
    /// </summary>
    /// <param name="loan"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    private static decimal GetDailyRate(Loan loan)
    {
        var rate = loan.InterestRate / 100m;

        return loan.InterestUnit switch
        {
            InterestUnit.PercentPerYear => rate / 365m,
            InterestUnit.PercentPerMonth => rate / 30m,
            InterestUnit.PercentPerDay => rate,
            _ => throw new Exception("Đơn vị lãi suất không hợp lệ.")
        };
    }
    #endregion
    #region Build
    /// <summary>
    /// Build note cho loan transaction
    /// </summary>
    /// <param name="loan"></param>
    /// <returns></returns>
    private static string BuildLoanDisbursementNote(Loan loan)
    {
        var action = loan.IsLending ? "Cho vay" : "Đi vay";

        return $"[{action}] {loan.CounterPartyName} | " +
               $"Gốc: {loan.PrincipalAmount:N0} {loan.Currency} | " +
               $"Phương thức: {loan.RepaymentMethod}";
    }

    /// <summary>
    /// !Ghi chú trans trả nợ
    /// </summary>
    /// <param name="requestNote"></param>
    /// <param name="loan"></param>
    /// <param name="allocation"></param>
    /// <param name="loanCurrency"></param>
    /// <returns></returns>
    private static string BuildRepaymentNote(string? requestNote, Loan loan, PaymentAllocationResult allocation, string loanCurrency)
    {
        var prefix = loan.IsLending
            ? "[Thu hồi khoản cho vay]"
            : "[Trả nợ khoản vay]";

        var note = string.IsNullOrWhiteSpace(requestNote)
            ? $"{prefix} {loan.CounterPartyName}"
            : requestNote.Trim();

        note += $" | Gốc: {allocation.PrincipalPaid:N0} {loanCurrency}";
        note += $" | Lãi: {allocation.InterestPaid:N0} {loanCurrency}";

        if (allocation.FeePaid > 0)
            note += $" | Phí: {allocation.FeePaid:N0} {loanCurrency}";

        if (allocation.PenaltyPaid > 0)
            note += $" | Phạt: {allocation.PenaltyPaid:N0} {loanCurrency}";

        return note;
    }
    #endregion
    private class PaymentAllocationResult
    {
        public decimal PrincipalPaid { get; set; }
        public decimal InterestPaid { get; set; }
        public decimal FeePaid { get; set; }
        public decimal PenaltyPaid { get; set; }

        public decimal TotalPaid { get; set; }

        public decimal UnappliedAmount { get; set; }
    }

    private async Task RefreshOverdueLoansAsync(int userId)
    {
        var today = DateTime.UtcNow.Date;

        var loans = await _context.Loans
            .Include(l => l.Schedules)
            .Where(l => l.UserId == userId)
            .Where(l => l.Status == LoanStatus.Active || l.Status == LoanStatus.Overdue)
            .ToListAsync();

        var hasChanged = false;

        foreach (var loan in loans)
        {
            if (loan.Status == LoanStatus.Completed ||
                loan.Status == LoanStatus.Cancelled)
            {
                continue;
            }

            var hasUnpaidSchedule = loan.Schedules.Any(s =>
                s.Status != RepaymentScheduleStatus.Cancelled &&
                s.UnpaidAmount > 0
            );

            if (!hasUnpaidSchedule)
                continue;

            var hasOverdueSchedule = loan.Schedules.Any(s =>
                s.Status != RepaymentScheduleStatus.Cancelled &&
                s.UnpaidAmount > 0 &&
                s.DueDate.Date < today
            );

            var newStatus = hasOverdueSchedule
                ? LoanStatus.Overdue
                : LoanStatus.Active;

            if (loan.Status != newStatus)
            {
                loan.Status = newStatus;
                hasChanged = true;
            }

            foreach (var schedule in loan.Schedules)
            {
                if (schedule.Status == RepaymentScheduleStatus.Cancelled ||
                    schedule.Status == RepaymentScheduleStatus.Paid ||
                    schedule.UnpaidAmount <= 0)
                {
                    continue;
                }

                var newScheduleStatus = schedule.DueDate.Date < today
                    ? RepaymentScheduleStatus.Overdue
                    : schedule.PaidTotalAmount > 0
                        ? RepaymentScheduleStatus.PartiallyPaid
                        : RepaymentScheduleStatus.Pending;

                if (schedule.Status != newScheduleStatus)
                {
                    schedule.Status = newScheduleStatus;
                    hasChanged = true;
                }
            }
        }

        if (hasChanged)
            await _context.SaveChangesAsync();
    }
}