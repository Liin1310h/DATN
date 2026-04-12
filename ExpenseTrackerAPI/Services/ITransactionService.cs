using ExpenseTrackerAPI.Models;
using ExpenseTrackerAPI.DTOs;

namespace ExpenseTrackerAPI.Services;

public interface ITransactionService
{
    Task<Transaction> CreateTransactionAsync(TransactionRequest request, int userId);
    Task<Transaction> UpdateTransactionAsync(int id, TransactionRequest request, int userId);
    Task DeleteTransactionAsync(int id, int userId);
    Task<Transaction> TransferAsync(TransferRequest request, int userId);
    Task<Transaction?> GetTransactionByIdAsync(int id, int userId);
    Task<PagedResult<TransactionResponse>> GetHistoryAsync(int userId, int? accountId, string? type, int? categoryId, DateTime? fromDate, DateTime? toDate, string? searchQuery, bool? isIn, int page, int pageSize);
    Task<TransactionChartDto> GetChartAsync(int userId, string range);
    Task<CategoryChartDto> GetCategoryChartAsync(int userId, string range);
}