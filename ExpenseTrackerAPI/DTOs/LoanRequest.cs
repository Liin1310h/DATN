namespace ExpenseTrackerAPI.DTOs;

public class LoanRequest
{
    // --- Thông tin đối tác ---
    required public string CounterPartyName { get; set; } // Tên người vay/cho vay

    // --- Thông tin tài chính ---
    required public decimal PrincipalAmount { get; set; } // Số tiền gốc
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
    required public int AccountId { get; set; } // Tài khoản dùng để chi tiền (cho vay) hoặc nhận tiền (đi vay)
    //Cho vay hay Đi vay
    required public bool IsLending { get; set; }
    public string? Note { get; set; }
}