namespace ExpenseTrackerAPI.Application.DTOs;

public class AccountDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Currency { get; set; } = "VND";
    public decimal Balance { get; set; }
    public string? Logo { get; set; }

    public int TransactionCountThisMonth { get; set; }
    public decimal TotalInThisMonth { get; set; }
    public decimal TotalOutThisMonth { get; set; }

    public List<AccountTransactionDto> TransactionsThisMonth { get; set; } = new();
}

public class AccountTransactionDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public int Type { get; set; }
    public string? Note { get; set; }
    public DateTime TransactionDate { get; set; }
    public string? CategoryName { get; set; }
}