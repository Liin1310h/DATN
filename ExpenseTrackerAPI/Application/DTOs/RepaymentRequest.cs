namespace ExpenseTrackerAPI.Application.DTOs;

public class RepaymentRequest
{
    required public int LoanId { get; set; }
    required public int AccountId { get; set; } // Tài khoản dùng để trả tiền hoặc nhận tiền trả
    required public decimal Amount { get; set; } // Số tiền trả (bao gồm cả gốc + lãi nếu có)
    public decimal? PrincipalPaid { get; set; } // Số tiền gốc thực tế trả (để trừ vào dư nợ)
    public string? Currency { get; set; }
    public decimal? InterestPaid { get; set; }  // Số tiền lãi trả
    public string? Note { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
}