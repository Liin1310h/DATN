using ExpenseTrackerAPI.Application.Interfaces.Notifications;
using ExpenseTrackerAPI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using WebPush;

namespace ExpenseTrackerAPI.Application.Services;

public class PushNotificationService : IPushNotificationService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public PushNotificationService(
        AppDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    /// <summary>
    /// TODO Gửi thông báo đẩy đến user(realtime)
    /// - Lấy danh sách subscription của user
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="title"></param>
    /// <param name="message"></param>
    /// <param name="url"></param>
    /// <returns></returns>
    public async Task SendToUserAsync(
        int userId,
        string title,
        string message,
        string url = "/")
    {
        var subscriptions = await _context.PushSubscriptions
            .Where(x => x.UserId == userId)
            .ToListAsync();

        if (!subscriptions.Any())
            return;

        var publicKey = _configuration["Vapid:PublicKey"];
        var privateKey = _configuration["Vapid:PrivateKey"];
        var subject = _configuration["Vapid:Subject"];

        var vapidDetails = new VapidDetails(
            subject,
            publicKey,
            privateKey
        );

        // Tạo web push client và payload
        var webPushClient = new WebPushClient();

        var payload = JsonSerializer.Serialize(new
        {
            title,
            body = message,
            icon = "/icons/icon-192x192.png",
            badge = "/icons/icon-192x192.png",
            url
        });

        // Gửi thông báo đẩy đến tất cả subscription của user
        foreach (var sub in subscriptions)
        {
            var pushSubscription = new PushSubscription(
                sub.Endpoint,
                sub.P256dh,
                sub.Auth
            );

            try
            {
                await webPushClient.SendNotificationAsync(
                    pushSubscription,
                    payload,
                    vapidDetails
                );
            }
            catch (WebPushException)
            {
                _context.PushSubscriptions.Remove(sub);
            }
        }

        await _context.SaveChangesAsync();
    }
}