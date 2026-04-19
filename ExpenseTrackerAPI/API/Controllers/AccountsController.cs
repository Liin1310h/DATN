
using System.Security.Claims;
using ExpenseTrackerAPI.Domain.Entities;
using ExpenseTrackerAPI.Application.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace ExpenseTrackerAPI.API.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _accountService;
    public AccountsController(IAccountService accountService) => _accountService = accountService;

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    [HttpGet]
    public async Task<ActionResult> GetAccounts()
    {
        var accounts = await _accountService.GetAccountsByUserIdAsync(GetUserId());
        return Ok(accounts);
    }

    [HttpPost]
    public async Task<ActionResult<Account>> PostAccount(Account account)
    {
        var result = await _accountService.CreateAccountAsync(account, GetUserId());
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Account>> PutAccount(int id, Account account)
    {
        try
        {
            await _accountService.UpdateAccountAsync(id, account, GetUserId());
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAccount(int id)
    {
        try
        {
            await _accountService.DeleteAccountAsync(id, GetUserId());
            return NoContent();
        }
        catch (Exception ex)
        {
            return NotFound(ex.Message);
        }
    }

}