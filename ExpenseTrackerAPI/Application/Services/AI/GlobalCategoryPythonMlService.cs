using System.Net.Http.Json;
using ExpenseTrackerAPI.Application.Interfaces.AI;
using ExpenseTrackerAPI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class GlobalCategoryMlService : IGlobalCategoryMlService
{
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;

    public GlobalCategoryMlService(AppDbContext context, HttpClient httpClient)
    {
        _context = context;
        _httpClient = httpClient;
    }

    public async Task TrainAsync()
    {
        var data = await _context.Transactions
            .Where(t =>
                t.CategoryId != null &&
                (t.Type == "expense" || t.Type == "income") &&
                !string.IsNullOrWhiteSpace(t.Note))
            .Select(t => new MlTrainingItemDto
            {
                Note = t.Note ?? "",
                Type = t.Type,
                Amount = t.Amount,
                CategoryId = t.CategoryId!.Value
            })
            .ToListAsync();

        var request = new MlTrainRequestDto
        {
            Data = data
        };

        var response = await _httpClient.PostAsJsonAsync("/train", request);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Train ML failed: {error}");
        }
    }

    public async Task<MlPredictResponseDto?> PredictAsync(
        string note,
        decimal amount,
        string type)
    {
        var request = new MlPredictRequestDto
        {
            Note = note,
            Amount = amount,
            Type = type
        };

        var response = await _httpClient.PostAsJsonAsync("/predict", request);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Python ML predict failed: {response.StatusCode} - {error}");
            return null;
        }

        return await response.Content.ReadFromJsonAsync<MlPredictResponseDto>();
    }
}