using ExpenseTrackerAPI.Application.Interfaces;
using ExpenseTrackerAPI.Application.Interfaces.Notifications;
using ExpenseTrackerAPI.Domain.Interfaces.Notifications;
using ExpenseTrackerAPI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class LoanReminderService : ILoanReminderService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IPushNotificationService _pushNotificationService;

    public LoanReminderService(
        AppDbContext context,
        INotificationService notificationService,
        IPushNotificationService pushNotificationService)
    {
        _context = context;
        _notificationService = notificationService;
        _pushNotificationService = pushNotificationService;
    }

    /// <summary>
    /// TODO Xử lý gửi nhắc hạn khoản vay cho user
    /// </summary>
    /// <returns></returns>
    public async Task ProcessReminderAsync()
    {
        var now = DateTime.UtcNow;

        // Lấy danh sách các khoản vay chưa hoàn thành, có nhắc hạn định kỳ, và đến hạn nhắc hạn
        var loans = await _context.Loans
            .Where(x => !x.IsCompleted)
            .Where(x => x.IsRecurringReminder)
            .Where(x => x.NextReminderDate != null)
            .Where(x => x.NextReminderDate <= now)
            .ToListAsync();

        foreach (var loan in loans)
        {
            var message = loan.IsLending
                ? $"{loan.CounterPartyName} sắp đến hạn trả bạn {loan.RemainingAmount:N0} {loan.Currency}"
                : $"Bạn sắp đến hạn trả {loan.CounterPartyName} {loan.RemainingAmount:N0} {loan.Currency}";

            // Tạo thông báo trong hệ thống
            await _notificationService.CreateAsync(
                loan.UserId,
                "Nhắc hạn khoản vay",
                message,
                "loan_reminder"
            );

            // Gửi thông báo đẩy đến user(realtime)
            await _pushNotificationService.SendToUserAsync(
                loan.UserId,
                "Nhắc hạn khoản vay",
                message,
                "/loan"
            );

            loan.NextReminderDate = null;
        }

        await _context.SaveChangesAsync();
    }
}