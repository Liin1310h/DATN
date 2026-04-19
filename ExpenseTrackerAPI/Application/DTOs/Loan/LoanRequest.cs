namespace ExpenseTrackerAPI.Application.DTOs;

public class LoanRequest
{
    public required string Currency = "VND";
    public required string CounterPartyName { get; set; } // Tên người vay/cho vay

    // --- Thông tin tài chính ---
    public required decimal PrincipalAmount { get; set; } // Số tiền gốc
    public decimal InterestRate { get; set; } = 0; // Lãi suất

    // Đơn vị lãi suất: "percentage_per_month", "percentage_per_year", "fixed_amount"
    public string InterestUnit { get; set; } = "percentage_per_year";

    // --- Thời hạn ---
    public int Duration { get; set; }
    // Đơn vị kỳ hạn: "days", "months", "years"
    public string DurationUnit { get; set; } = "months";

    // --- Thời gian ---
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; } // Ngày đáo hạn dự kiến
    // --- Logic Giao dịch đi kèm ---
    public required int AccountId { get; set; } // Tài khoản dùng để chi tiền (cho vay) hoặc nhận tiền (đi vay)
    //Cho vay hay Đi vay
    public required bool IsLending { get; set; }
    public string? Note { get; set; }
}