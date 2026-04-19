namespace ExpenseTrackerAPI.Application.DTOs;

public class LoanDto
{
    public int Id { get; set; }
    public string CounterPartyName { get; set; } = "";
    public decimal PrincipalAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public decimal InterestRate { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; }
}