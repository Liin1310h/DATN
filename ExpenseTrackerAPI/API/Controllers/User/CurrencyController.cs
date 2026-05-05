using ExpenseTrackerAPI.Application.Interfaces.User;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTrackerAPI.API.Controllers.User;

[ApiController]
[Route("api/[controller]")]
public class CurrencyController : ControllerBase
{
    private readonly ICurrencyService _currencyService;

    public CurrencyController(ICurrencyService currencyService)
    {
        _currencyService = currencyService;
    }

    [HttpGet("rates")]
    public async Task<IActionResult> GetRates(string baseCurrency = "USD")
    {
        try
        {
            var rates = await _currencyService.GetRatesAsync(baseCurrency);
            return Ok(rates);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("rate")]
    public async Task<IActionResult> GetRate(string from, string to)
    {
        try
        {
            var rate = await _currencyService.GetRateAsync(from, to);
            return Ok(new { from, to, rate });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("convert")]
    public async Task<IActionResult> Convert(
        string from,
        string to,
        decimal amount)
    {
        try
        {
            var result = await _currencyService.ConvertAsync(amount, from, to);
            return Ok(new { from, to, amount, result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
