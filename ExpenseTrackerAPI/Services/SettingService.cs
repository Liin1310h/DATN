using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Services;

public class SettingsService : ISettingsService
{
    private readonly AppDbContext _context;
    public SettingsService(AppDbContext context) => _context = context;

    public async Task<UserSetting> GetOrCreateSettingsAsync(int userId)
    {
        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            // Tạo mặc định nếu lần đầu truy cập
            settings = new UserSetting
            {
                UserId = userId,
                DefaultCurrency = "VND",
                Language = "vi",
                Theme = "light",
                UpdatedAt = DateTime.UtcNow
            };
            _context.UserSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        return settings;
    }

    public async Task UpdateSettingsAsync(UserSetting settingsDto, int userId)
    {
        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null) throw new Exception("Không tìm thấy cài đặt cho người dùng này.");

        settings.DefaultCurrency = settingsDto.DefaultCurrency;
        settings.Language = settingsDto.Language;
        settings.Theme = settingsDto.Theme;
        settings.UpdatedAt = DateTime.UtcNow;

        _context.UserSettings.Update(settings);
        await _context.SaveChangesAsync();
    }
}