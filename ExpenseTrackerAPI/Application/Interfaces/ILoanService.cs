using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Application.DTOs;

namespace ExpenseTrackerAPI.Application.Interfaces;

public interface ILoanService
{
    Task<Loan> CreateLoanAsync(LoanRequest request, int userId);
    Task UpdateLoanAsync(int loanId, LoanUpdateRequest request, int userId);
    Task<Transaction> ProcessRepaymentAsync(RepaymentRequest request, int userId);
    Task<IEnumerable<Loan>> GetUserLoansAsync(int userId, bool? isCompleted);
    Task<Loan?> GetLoanDetailsAsync(int loanId, int userId);
    Task DeleteLoanAsync(int loanId, int userId);
}