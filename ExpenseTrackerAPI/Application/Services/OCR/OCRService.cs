using System.Net.Http.Headers;
using System.Text.Json;
using ExpenseTrackerAPI.Application.DTOs.Ocr;
using ExpenseTrackerAPI.Application.Interfaces.OCR;

namespace ExpenseTrackerAPI.Application.Services.OCR;

public class OcrService : IOcrService
{
    private readonly HttpClient _http;

    public OcrService(HttpClient http)
    {
        _http = http;
    }

    public async Task<OcrResponseDto> ExtractAsync(IFormFile file)
    {
        using var content = new MultipartFormDataContent();

        using var stream = file.OpenReadStream();
        var fileContent = new StreamContent(stream);

        fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);

        content.Add(fileContent, "file", file.FileName);

        var response = await _http.PostAsync("ocr", content);

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception("OCR server error");
        }

        var json = await response.Content.ReadAsStringAsync();

        var result = System.Text.Json.JsonSerializer.Deserialize<OcrResponseDto>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return result!;
    }
}
