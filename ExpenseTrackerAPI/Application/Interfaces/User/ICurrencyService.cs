namespace ExpenseTrackerAPI.Application.Interfaces.User;

public interface ICurrencyService
{
    Task<decimal> ConvertAsync(decimal amount, string from, string to);
    Task<decimal> GetRateAsync(string fromCurrency, string toCurrency);
    Task<Dictionary<string, decimal>> GetRatesAsync(string baseCurrency);
}