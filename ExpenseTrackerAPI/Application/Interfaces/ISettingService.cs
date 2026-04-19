using ExpenseTrackerAPI.Domain.Entities;

namespace ExpenseTrackerAPI.Application.Interfaces;

public interface ISettingsService
{
    Task<UserSetting> GetOrCreateSettingsAsync(int userId);
    Task UpdateSettingsAsync(UserSetting settingsDto, int userId);
}