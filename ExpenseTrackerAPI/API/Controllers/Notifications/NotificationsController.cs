using ExpenseTrackerAPI.Application.DTOs.Notification;
using ExpenseTrackerAPI.Application.Interfaces.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ExpenseTrackerAPI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    private int GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
            throw new UnauthorizedAccessException("Không xác định được người dùng.");

        return int.Parse(userId);
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] bool? isRead)
    {
        try
        {
            var userId = GetUserId();

            var notifications = await _notificationService
                .GetUserNotificationsAsync(userId, isRead);

            return Ok(notifications);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        try
        {
            var userId = GetUserId();

            var count = await _notificationService.GetUnreadCountAsync(userId);

            return Ok(new
            {
                unreadCount = count
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{notificationId:int}/read")]
    public async Task<IActionResult> MarkAsRead(int notificationId)
    {
        try
        {
            var userId = GetUserId();

            await _notificationService.MarkAsReadAsync(notificationId, userId);

            return Ok(new
            {
                message = "Đã đánh dấu thông báo là đã đọc."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        try
        {
            var userId = GetUserId();

            await _notificationService.MarkAllAsReadAsync(userId);

            return Ok(new
            {
                message = "Đã đánh dấu tất cả thông báo là đã đọc."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{notificationId:int}")]
    public async Task<IActionResult> DeleteNotification(int notificationId)
    {
        try
        {
            var userId = GetUserId();

            await _notificationService.DeleteAsync(notificationId, userId);

            return Ok(new
            {
                message = "Đã xóa thông báo."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("test")]
    public async Task<IActionResult> CreateTestNotification(
    [FromBody] CreateNotificationRequest request)
    {
        try
        {
            var userId = GetUserId();

            var result = await _notificationService.CreateAsync(
                userId,
                request.Title,
                request.Message,
                request.Type,
                request.RedirectUrl
            );

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}