namespace ExpenseTrackerAPI.Application.DTOs.Notification;

public class PushSubscriptionRequest
{
    public string Endpoint { get; set; } = string.Empty;
    public PushKeys Keys { get; set; } = new();
}