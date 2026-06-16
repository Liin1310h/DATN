using ExpenseTrackerAPI.Domain.Entities;
namespace ExpenseTrackerAPI.Application.Interfaces.Notifications;

public interface INotificationService
{
    Task<Notification> CreateAsync(
        int userId,
        string title,
        string message,
        string type,
        string? redirectUrl = null,
        string? referenceKey = null);

    Task<List<Notification>> GetUserNotificationsAsync(
        int userId,
        bool? isRead = null);

    Task<int> GetUnreadCountAsync(int userId);

    Task MarkAsReadAsync(int notificationId, int userId);

    Task MarkAllAsReadAsync(int userId);

    Task DeleteAsync(int notificationId, int userId);
}