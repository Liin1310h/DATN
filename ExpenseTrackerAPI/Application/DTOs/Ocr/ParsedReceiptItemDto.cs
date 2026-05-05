namespace ExpenseTrackerAPI.Application.DTOs.Ocr
{
    public class ParsedReceiptItemDto
    {
        public string Name { get; set; } = "";
        public decimal? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Amount { get; set; }
        public double Confidence { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public double? CategoryConfidence { get; set; }
    }
}
