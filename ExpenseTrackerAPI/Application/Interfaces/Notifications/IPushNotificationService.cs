namespace ExpenseTrackerAPI.Application.Interfaces.Notifications;

public interface IPushNotificationService
{
    Task SendToUserAsync(int userId, string title, string message, string url = "/");
}