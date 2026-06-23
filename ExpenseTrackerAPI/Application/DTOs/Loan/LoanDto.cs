using ExpenseTrackerAPI.Domain.Enums;

namespace ExpenseTrackerAPI.Application.DTOs;

public class LoanDto
{
    public int Id { get; set; }
    public string CounterPartyName { get; set; } = "";
    public decimal PrincipalAmount { get; set; }
    public decimal RemainingPrincipalAmount { get; set; }
    public decimal InterestRate { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsLending { get; set; }
    public LoanStatus Status { get; set; }
    public RepaymentMethod RepaymentMethod { get; set; }
    public LoanCounterPartyType CounterPartyType { get; set; }
}