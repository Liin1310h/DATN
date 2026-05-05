using ExpenseTrackerAPI.Application.DTOs.Notification;
using ExpenseTrackerAPI.Domain.Interfaces.Notifications;
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
        var userId = GetUserId();

        var notifications = await _notificationService
            .GetUserNotificationsAsync(userId, isRead);

        return Ok(notifications);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetUserId();

        var count = await _notificationService.GetUnreadCountAsync(userId);

        return Ok(new
        {
            unreadCount = count
        });
    }

    [HttpPut("{notificationId:int}/read")]
    public async Task<IActionResult> MarkAsRead(int notificationId)
    {
        var userId = GetUserId();

        await _notificationService.MarkAsReadAsync(notificationId, userId);

        return Ok(new
        {
            message = "Đã đánh dấu thông báo là đã đọc."
        });
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetUserId();

        await _notificationService.MarkAllAsReadAsync(userId);

        return Ok(new
        {
            message = "Đã đánh dấu tất cả thông báo là đã đọc."
        });
    }

    [HttpDelete("{notificationId:int}")]
    public async Task<IActionResult> DeleteNotification(int notificationId)
    {
        var userId = GetUserId();

        await _notificationService.DeleteAsync(notificationId, userId);

        return Ok(new
        {
            message = "Đã xóa thông báo."
        });
    }

    [HttpPost("test")]
    public async Task<IActionResult> CreateTestNotification(
    [FromBody] CreateNotificationRequest request)
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
}