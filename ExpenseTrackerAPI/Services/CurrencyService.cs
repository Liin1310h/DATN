using ExpenseTrackerAPI.DTOs;
using System.Text.Json;

namespace ExpenseTrackerAPI.Services
{
    public class CurrencyService
    {
        private readonly HttpClient _httpClient;
        private static Dictionary<string, Dictionary<string, decimal>> _cache = new();
        private static Dictionary<string, DateTime> _lastFetch = new();

        public CurrencyService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<Dictionary<string, decimal>> GetRates(string baseCurrency)
        {
            if (_cache.ContainsKey(baseCurrency) &&
                DateTime.Now - _lastFetch[baseCurrency] < TimeSpan.FromMinutes(10))
            {
                return _cache[baseCurrency];
            }

            var url = $"https://api.exchangerate-api.com/v4/latest/{baseCurrency}";
            var response = await _httpClient.GetStringAsync(url);

            var data = JsonSerializer.Deserialize<Currency>(response);
            if(data == null || data.Rates == null)
                throw new Exception("Lỗi khi lấy tỷ giá. Vui lòng thử lại sau.");
                
            _cache[baseCurrency] = data.Rates;
            _lastFetch[baseCurrency] = DateTime.Now;

            return data.Rates;
        }

        public async Task<object> Convert(string from, string to, decimal amount)
        {
            var rates = await GetRates(from);

            if (!rates.ContainsKey(to))
                throw new Exception("Invalid currency");

            var rate = rates[to];
            var result = amount * rate;

            return new
            {
                from,
                to,
                amount,
                rate,
                result
            };
        }
    }
}