namespace ExpenseTrackerAPI.Application.DTOs.Notification;

public class CreateNotificationRequest
{
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
    public string Type { get; set; } = "test";
    public string? RedirectUrl { get; set; }
}