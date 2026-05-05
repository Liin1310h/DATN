namespace ExpenseTrackerAPI.Application.DTOs.AI
{
    public class AIReceiptDto
    {
        public string? merchant { get; set; }
        public string? date { get; set; }
        public decimal? total { get; set; }
        public decimal? vat { get; set; }
        public List<AIItem>? items { get; set; }

        public class AIItem
        {
            public string name { get; set; }
            public decimal amount { get; set; }
        }
    }
}
