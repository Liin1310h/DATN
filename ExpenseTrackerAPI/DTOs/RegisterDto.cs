namespace ExpenseTrackerAPI.DTOs;

public class RegisterDto
{
    required
    public string Email { get; set; }
    required
    public string Password { get; set; }
    required
    public string FullName { get; set; }
}