namespace ExpenseTrackerAPI.Application.DTOs.Ocr
{
    public class ParsedReceiptDto
    {
        public bool Success { get; set; }
        public string? Merchant { get; set; }
        public DateTime? TransactionDate { get; set; }
        public decimal? Subtotal { get; set; }
        public decimal? VatAmount { get; set; }
        public decimal? TotalAmount { get; set; }
        public string Currency { get; set; } = "VND";
        public string RawText { get; set; } = "";
        public double OcrConfidence { get; set; }
        public double ParseConfidence { get; set; }
        public List<ParsedReceiptItemDto> Items { get; set; } = new();
    }
}
