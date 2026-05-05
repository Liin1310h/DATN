using ExpenseTrackerAPI.Application.DTOs;

namespace ExpenseTrackerAPI.Application.Interfaces.Auth;

public interface IAuthService
{
    Task<string> RegisterAsync(RegisterDto registerDto);
    Task<string> LoginAsync(LoginDto loginDto);
}