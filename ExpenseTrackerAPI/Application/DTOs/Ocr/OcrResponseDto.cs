namespace ExpenseTrackerAPI.Application.DTOs.Ocr
{
    public class OcrResponseDto
    {
        public bool Success { get; set; }
        public string? Filename { get; set; }
        public string? Raw_Text { get; set; }
        public double Avg_Confidence { get; set; }
        public List<OcrLineDto> Lines { get; set; } = new();
    }
}
