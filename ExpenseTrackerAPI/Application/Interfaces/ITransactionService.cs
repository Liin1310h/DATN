using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Application.DTOs;

namespace ExpenseTrackerAPI.Application.Interfaces;

public interface ITransactionService
{
    Task<Transaction> CreateTransactionAsync(TransactionRequest request, int userId);
    Task<Transaction> UpdateTransactionAsync(int id, TransactionRequest request, int userId);
    Task DeleteTransactionAsync(int id, int userId);
    Task<Transaction> TransferAsync(TransferRequest request, int userId);
    Task<Transaction?> GetTransactionByIdAsync(int id, int userId);
    Task<PagedResult<TransactionResponse>> GetHistoryAsync(
        int userId,
        int? accountId,
        string? type,
        int? categoryId,
        DateTime? fromDate,
        DateTime? toDate,
        string? searchQuery,
        bool? isIn,
        int page,
        int pageSize
    );
}