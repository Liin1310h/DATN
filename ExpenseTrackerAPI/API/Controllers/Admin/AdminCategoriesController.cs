using ExpenseTrackerAPI.Application.DTOs;
using ExpenseTrackerAPI.Application.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTrackerAPI.API.Controllers.Admin;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "Admin")]
public class AdminCategoriesController : ControllerBase
{
    private readonly IAdminCategoryService _adminCategoryService;

    public AdminCategoriesController(IAdminCategoryService adminCategoryService)
    {
        _adminCategoryService = adminCategoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories([FromQuery] string? search)
    {
        var result = await _adminCategoryService.GetSystemCategoriesAsync(search);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] AdminCategoryRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _adminCategoryService.CreateSystemCategoryAsync(request);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] AdminCategoryRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _adminCategoryService.UpdateSystemCategoryAsync(id, request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        await _adminCategoryService.DeleteSystemCategoryAsync(id);
        return NoContent();
    }
}