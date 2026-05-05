namespace ExpenseTrackerAPI.Application.DTOs.Ocr
{
    public class OcrLineDto
    {
        public int Index { get; set; }
        public string Text { get; set; } = "";
        public double Confidence { get; set; }
        public List<List<double>>? Bbox { get; set; }
    }
}
