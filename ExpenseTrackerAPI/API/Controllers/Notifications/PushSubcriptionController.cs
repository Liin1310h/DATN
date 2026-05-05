using ExpenseTrackerAPI.Application.DTOs.Notification;
using ExpenseTrackerAPI.Infrastructure.Data;
using ExpenseTrackerAPI.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ExpenseTrackerAPI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PushSubscriptionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public PushSubscriptionsController(
        AppDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    private int GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
            throw new UnauthorizedAccessException("Không xác định được người dùng.");

        return int.Parse(userId);
    }

    [HttpGet("public-key")]
    [AllowAnonymous]
    public IActionResult GetPublicKey()
    {
        return Ok(new
        {
            publicKey = _configuration["Vapid:PublicKey"]
        });
    }

    [HttpPost]
    public async Task<IActionResult> SaveSubscription(
        [FromBody] PushSubscriptionRequest request)
    {
        var userId = GetUserId();

        if (string.IsNullOrWhiteSpace(request.Endpoint))
            return BadRequest(new { message = "Endpoint không hợp lệ." });

        if (string.IsNullOrWhiteSpace(request.Keys.P256dh) ||
            string.IsNullOrWhiteSpace(request.Keys.Auth))
            return BadRequest(new { message = "Push keys không hợp lệ." });

        var existed = await _context.PushSubscriptions
            .FirstOrDefaultAsync(x =>
                x.UserId == userId &&
                x.Endpoint == request.Endpoint);

        if (existed == null)
        {
            var entity = new PushSubscriptionEntity
            {
                UserId = userId,
                Endpoint = request.Endpoint,
                P256dh = request.Keys.P256dh,
                Auth = request.Keys.Auth
            };

            _context.PushSubscriptions.Add(entity);
        }
        else
        {
            existed.P256dh = request.Keys.P256dh;
            existed.Auth = request.Keys.Auth;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã lưu thiết bị nhận thông báo." });
    }
}