using ExpenseTrackerAPI.API.Hubs;
using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Domain.Interfaces.Notifications;
using ExpenseTrackerAPI.Infrastructure.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubService;
    public NotificationService(AppDbContext context, IHubContext<NotificationHub> hubService)
    {
        _context = context;
        _hubService = hubService;
    }

    /// <summary>
    /// TODO Tạo thông báo mới cho người dùng
    /// sau đó gửi thông báo real-time qua SignalR
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="title"></param>
    /// <param name="message"></param>
    /// <param name="type"></param>phân loại thông báo
    /// <param name="redirectUrl"></param>url khi click vào notification
    /// <returns></returns>
    public async Task<Notification> CreateAsync(int userId, string title, string message, string type, string? redirectUrl = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            RedirectUrl = redirectUrl,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Gửi thông báo real-time qua SignalR
        await _hubService.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", notification);

        return notification;
    }

    /// <summary>
    /// TODO Lấy danh sách thông báo + lọc theo trạng thái đã đọc/chưa đọc của user
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="isRead"></param>
    /// <returns></returns>
    public async Task<List<Notification>> GetUserNotificationsAsync(
        int userId,
        bool? isRead = null)
    {
        var query = _context.Notifications
            .Where(x => x.UserId == userId);

        if (isRead.HasValue)
            query = query.Where(x => x.IsRead == isRead.Value);

        return await query
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// TODO Lấy số lượng thông báo chưa đọc của user
    /// </summary>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _context.Notifications
            .CountAsync(x => x.UserId == userId && !x.IsRead);
    }

    /// <summary>
    /// TODO Đánh dấu một thông báo đã đọc
    /// </summary>
    /// <param name="notificationId"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async Task MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(x => x.Id == notificationId && x.UserId == userId);

        if (notification == null)
            throw new Exception("Thông báo không tồn tại.");

        notification.IsRead = true;

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// TODO Đánh dấu tất cả thông báo của user là đã đọc
    /// </summary>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task MarkAllAsReadAsync(int userId)
    {
        var notifications = await _context.Notifications
            .Where(x => x.UserId == userId && !x.IsRead)
            .ToListAsync();

        foreach (var item in notifications)
        {
            item.IsRead = true;
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// TODO Xóa một thông báo của user
    /// </summary>
    /// <param name="notificationId"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async Task DeleteAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(x => x.Id == notificationId && x.UserId == userId);

        if (notification == null)
            throw new Exception("Thông báo không tồn tại.");

        _context.Notifications.Remove(notification);

        await _context.SaveChangesAsync();
    }
}