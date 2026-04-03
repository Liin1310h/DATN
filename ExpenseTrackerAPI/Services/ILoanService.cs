using ExpenseTrackerAPI.Models;
using ExpenseTrackerAPI.DTOs;

namespace ExpenseTrackerAPI.Services;

public interface ILoanService
{
    // Tạo khoản vay/cho vay mới
    Task<Loan> CreateLoanAsync(LoanRequest request, int userId);
    // Xử lý trả nợ + update khoản vay
    Task<Transaction> ProcessRepaymentAsync(RepaymentRequest request, int userId);
    // Lấy danh sách khoản vay của user
    Task<IEnumerable<Loan>> GetUserLoansAsync(int userId, bool? isCompleted);
    // Lấy chi tiết 1 khoản vay kèm lịch sử giao dịch của nó
    Task<Loan?> GetLoanDetailsAsync(int loanId, int userId);
}