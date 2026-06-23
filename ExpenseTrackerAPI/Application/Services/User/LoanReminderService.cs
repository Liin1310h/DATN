using ExpenseTrackerAPI.Application.Interfaces;
using ExpenseTrackerAPI.Application.Interfaces.Notifications;
using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Domain.Enums;
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
            .Include(l => l.Schedules)
            .Where(l => l.Status != LoanStatus.Completed)
            .Where(l => l.Status != LoanStatus.Cancelled)
            .Where(x => x.IsRecurringReminder)
            .Where(x => x.NextReminderDate != null)
            .Where(x => x.NextReminderDate <= now)
            .ToListAsync();

        foreach (var loan in loans)
        {
            var targetSchedule = GetNextUnpaidSchedule(loan);

            if (targetSchedule == null)
            {
                loan.Status = LoanStatus.Completed;
                loan.IsRecurringReminder = false;
                loan.NextReminderDate = null;
                continue;
            }

            if (targetSchedule.DueDate.Date < now.Date)
            {
                loan.Status = LoanStatus.Overdue;
                targetSchedule.Status = RepaymentScheduleStatus.Overdue;
            }

            var message = BuildReminderMessage(loan, targetSchedule, now);

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

            loan.NextReminderDate = CalculateNextReminderDateAfterSent(loan, now);
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// !Lấy kỳ hạn chưa trả
    /// </summary>
    /// <param name="loan"></param>
    /// <returns></returns>
    private static RepaymentSchedule? GetNextUnpaidSchedule(Loan loan)
    {
        return loan.Schedules
            .Where(s => s.Status != RepaymentScheduleStatus.Cancelled)
            .Where(s => s.UnpaidAmount > 0)
            .OrderBy(s => s.DueDate)
            .ThenBy(s => s.Period)
            .FirstOrDefault();
    }

    /// <summary>
    /// !Xây tin nhắn nhắc nhở
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="schedule"></param>
    /// <param name="now"></param>
    /// <returns></returns>
    private static string BuildReminderMessage(Loan loan, RepaymentSchedule schedule, DateTime now)
    {
        var amount = schedule.UnpaidAmount;
        var dueDateText = schedule.DueDate.ToString("dd/MM/yyyy");
        var daysLeft = (schedule.DueDate.Date - now.Date).Days;

        if (schedule.DueDate.Date < now.Date)
        {
            return loan.IsLending
                ? $"{loan.CounterPartyName} đã quá hạn trả bạn kỳ {schedule.Period}: {amount:N0} {loan.Currency}, hạn ngày {dueDateText}."
                : $"Bạn đã quá hạn trả {loan.CounterPartyName} kỳ {schedule.Period}: {amount:N0} {loan.Currency}, hạn ngày {dueDateText}.";
        }

        if (schedule.DueDate.Date == now.Date)
        {
            return loan.IsLending
                ? $"{loan.CounterPartyName} đến hạn trả bạn hôm nay kỳ {schedule.Period}: {amount:N0} {loan.Currency}."
                : $"Bạn đến hạn trả {loan.CounterPartyName} hôm nay kỳ {schedule.Period}: {amount:N0} {loan.Currency}.";
        }

        return loan.IsLending
            ? $"{loan.CounterPartyName} sắp đến hạn trả bạn kỳ {schedule.Period}: {amount:N0} {loan.Currency} vào ngày {dueDateText}, còn {daysLeft} ngày."
            : $"Bạn sắp đến hạn trả {loan.CounterPartyName} kỳ {schedule.Period}: {amount:N0} {loan.Currency} vào ngày {dueDateText}, còn {daysLeft} ngày.";
    }

    /// <summary>
    /// !Tính toán ngày nhắc tiếp theo sau khi gửi
    /// </summary>
    /// <param name="loan"></param>
    /// <param name="now"></param>
    /// <returns></returns>
    private static DateTime? CalculateNextReminderDateAfterSent(Loan loan, DateTime now)
    {
        if (!loan.IsRecurringReminder)
            return null;

        var unpaidSchedules = loan.Schedules
            .Where(s => s.Status != RepaymentScheduleStatus.Cancelled)
            .Where(s => s.UnpaidAmount > 0)
            .OrderBy(s => s.DueDate)
            .ThenBy(s => s.Period)
            .ToList();

        if (!unpaidSchedules.Any())
            return null;

        var candidates = new List<DateTime>();

        var currentSchedule = unpaidSchedules.First();

        if (currentSchedule.DueDate.Date > now.Date)
        {
            var nextRepeatedReminder = AddByReminderFrequency(
                now,
                loan.ReminderFrequency
            );

            if (nextRepeatedReminder.Date <= currentSchedule.DueDate.Date)
            {
                candidates.Add(nextRepeatedReminder);
            }
        }

        foreach (var schedule in unpaidSchedules)
        {
            var firstReminderDate = schedule.DueDate.AddDays(-loan.ReminderBeforeDays);

            if (firstReminderDate > now)
            {
                candidates.Add(firstReminderDate);
            }
        }

        if (!candidates.Any())
            return null;

        return candidates
            .OrderBy(x => x)
            .First();
    }

    private static DateTime AddByReminderFrequency(DateTime current, ReminderFrequency frequency)
    {
        return frequency switch
        {
            ReminderFrequency.Daily => current.AddDays(1),
            ReminderFrequency.Weekly => current.AddDays(7),
            ReminderFrequency.Monthly => current.AddMonths(1),
            _ => current.AddDays(1)
        };
    }
}