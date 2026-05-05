using Microsoft.AspNetCore.Mvc;

namespace ExpenseTrackerAPI.API.Controllers.User;

[ApiController]
[Route("api/media")]
public class MediaController : ControllerBase
{
    private readonly IConfiguration _config;

    public MediaController(IConfiguration config)
    {
        _config = config;
    }

    [HttpGet("signature")]
    public IActionResult GetSignature()
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        var apiSecret = _config["CloudinarySettings:ApiSecret"];

        // params phải giống frontend gửi lên
        var paramString = $"folder=expense-tracker&timestamp={timestamp}{apiSecret}";

        using var sha1 = System.Security.Cryptography.SHA1.Create();
        var hashBytes = sha1.ComputeHash(System.Text.Encoding.UTF8.GetBytes(paramString));
        var signature = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();

        return Ok(new
        {
            timestamp,
            signature,
            apiKey = _config["CloudinarySettings:ApiKey"],
            cloudName = _config["CloudinarySettings:CloudName"]
        });
    }
}
