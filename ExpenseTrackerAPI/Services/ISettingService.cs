using ExpenseTrackerAPI.Models;

namespace ExpenseTrackerAPI.Services;

public interface ISettingsService
{
    Task<UserSetting> GetOrCreateSettingsAsync(int userId);
    Task UpdateSettingsAsync(UserSetting settingsDto, int userId);
}