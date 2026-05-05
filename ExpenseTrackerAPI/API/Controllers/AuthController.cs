using System.Security.Claims;
using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Application.Interfaces.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace ExpenseTrackerAPI.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // TODO: ĐĂNG KÝ
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var result = await _authService.RegisterAsync(registerDto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    // TODO: ĐĂNG NHẬP
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var token = await _authService.LoginAsync(loginDto);
            return Ok(new { token });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("/me")]
    public IActionResult Me()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        return Ok(new { userId, email, role });
    }
}