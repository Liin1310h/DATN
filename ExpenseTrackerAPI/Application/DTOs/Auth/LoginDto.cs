using System.ComponentModel.DataAnnotations;

namespace ExpenseTrackerAPI.Application.DTOs;

public class LoginDto
{
    [Required(ErrorMessage = "Email bắt buộc.")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu bắt buộc.")]
    [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
    public string Password { get; set; } = string.Empty;
}