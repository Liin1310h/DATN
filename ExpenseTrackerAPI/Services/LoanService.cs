using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using ExpenseTrackerAPI.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Services;

public class LoanService : ILoanService
{
    private readonly AppDbContext _context;

    public LoanService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Loan> CreateLoanAsync(LoanRequest request, int userId)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Tạo đối tượng Loan
            var loan = new Loan
            {
                UserId = userId,
                CounterPartyName = request.CounterPartyName,
                PrincipalAmount = request.PrincipalAmount,
                RemainingAmount = request.PrincipalAmount,
                InterestRate = request.InterestRate,
                InterestUnit = request.InterestUnit,
                StartDate = request.StartDate,
                DueDate = request.DueDate,
                Note = request.Note ?? "",
                IsCompleted = false
            };

            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();

            // Cập nhật số dư Tài khoản liên quan
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Id == request.AccountId && a.UserId == userId);

            if (account == null) throw new Exception("Tài khoản không tồn tại hoặc không thuộc quyền sở hữu của bạn.");

            // Xác định loại giao dịch: Cho vay (Lend) -> Ví giảm | Đi vay (Borrow) -> Ví tăng
            string transType = request.IsLending ? "lend" : "borrow";
            decimal balanceBefore = account.Balance;

            if (request.IsLending)
            {
                if (account.Balance < request.PrincipalAmount) throw new Exception("Số dư tài khoản không đủ để thực hiện cho vay.");
                account.Balance -= request.PrincipalAmount;
            }
            else
            {
                account.Balance += request.PrincipalAmount;
            }

            var transaction = new Transaction
            {
                UserId = userId,
                Amount = request.PrincipalAmount,
                Type = transType,
                FromAccountId = request.IsLending ? request.AccountId : null,
                ToAccountId = !request.IsLending ? request.AccountId : null,
                BalanceBefore = balanceBefore,
                BalanceAfter = account.Balance,
                TransactionDate = request.StartDate,
                LoanId = loan.Id,
                Note = $"[Vay nợ] Giao dịch giải ngân cho: {request.CounterPartyName}"
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

    public async Task<Transaction> ProcessRepaymentAsync(RepaymentRequest request, int userId)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var loan = await _context.Loans.FirstOrDefaultAsync(l => l.Id == request.LoanId && l.UserId == userId);
            if (loan == null) throw new Exception("Khoản vay không tồn tại.");
            if (loan.IsCompleted) throw new Exception("Khoản vay này đã được thanh toán xong.");

            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == request.AccountId && a.UserId == userId);
            if (account == null) throw new Exception("Tài khoản thanh toán không hợp lệ.");

            var initialTrans = await _context.Transactions
                .Where(t => t.LoanId == loan.Id)
                .OrderBy(t => t.TransactionDate)
                .FirstOrDefaultAsync();

            string repayTransType = initialTrans?.Type == "lend" ? "income" : "expense";
            decimal balanceBefore = account.Balance;

            // Cập nhật số dư tài khoản
            if (repayTransType == "expense")
            {
                if (account.Balance < request.Amount) throw new Exception("Số dư không đủ để trả nợ.");
                account.Balance -= request.Amount;
            }
            else
            {
                account.Balance += request.Amount;
            }

            // Cập nhật nợ còn lại (Trừ vào phần gốc nợ)
            decimal amountToReduce = request.PrincipalPaid ?? request.Amount;
            loan.RemainingAmount -= amountToReduce;

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

    public async Task<IEnumerable<Loan>> GetUserLoansAsync(int userId, bool? isCompleted)
    {
        var query = _context.Loans.Where(l => l.UserId == userId);

        if (isCompleted.HasValue)
            query = query.Where(l => l.IsCompleted == isCompleted.Value);

        return await query.OrderByDescending(l => l.StartDate).ToListAsync();
    }

    public async Task<Loan?> GetLoanDetailsAsync(int loanId, int userId)
    {
        return await _context.Loans
            .Include(l => l.Transactions.OrderByDescending(t => t.TransactionDate))
            .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);
    }
}