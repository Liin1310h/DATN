using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Application.Interfaces.User;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace ExpenseTrackerAPI.Infrastructure.Services
{
    public class CurrencyService : ICurrencyService
    {
        private readonly IMemoryCache _cache; //cache lưu tỷ giá
        private readonly HttpClient _httpClient;

        public CurrencyService(IMemoryCache cache, HttpClient httpClient)
        {
            _cache = cache;
            _httpClient = httpClient;
        }

        /// <summary>
        /// Lấy toàn bộ rates theo baseCurrency
        /// </summary>
        /// <param name="baseCurrency"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public async Task<Dictionary<string, decimal>> GetRatesAsync(string baseCurrency)
        {
            var cacheKey = $"rate_{baseCurrency}";
            if (_cache.TryGetValue(cacheKey, out Dictionary<string, decimal>? rates) && rates != null)
            {
                return rates;
            }

            var url = $"https://api.exchangerate-api.com/v4/latest/{baseCurrency}";
            var response = await _httpClient.GetStringAsync(url);

            var data = JsonSerializer.Deserialize<Currency>(response);
            if (data == null || data.Rates == null)
                throw new Exception("Lỗi khi lấy tỷ giá. Vui lòng thử lại sau.");

            _cache.Set(cacheKey, data.Rates, TimeSpan.FromMinutes(10));

            return data.Rates;
        }

        /// <summary>
        /// Lấy 1 tỷ giá cụ thể
        /// </summary>
        /// <param name="from"></param>
        /// <param name="to"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public async Task<decimal> GetRateAsync(string from, string to)
        {
            if (from == to) return 1;

            var rates = await GetRatesAsync(from);

            if (!rates.ContainsKey(to))
                throw new Exception("Currency không hợp lệ");

            return rates[to];
        }


        /// <summary>
        /// Hàm covert tiền
        /// </summary>
        /// <param name="from"></param>
        /// <param name="to"></param>
        /// <param name="amount"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public async Task<decimal> ConvertAsync(decimal amount, string from, string to)
        {
            if (from == to) return amount;
            var rate = await GetRateAsync(from, to);
            return amount * rate;
        }
    }
}