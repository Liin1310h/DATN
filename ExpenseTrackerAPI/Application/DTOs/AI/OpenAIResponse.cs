namespace ExpenseTrackerAPI.Application.DTOs.AI
{
    public class OpenAIResponse
    {
        public List<Choice> Choices { get; set; } = new();

        public class Choice
        {
            public Message Message { get; set; } = new();
        }

        public class Message
        {
            public string Content { get; set; } = string.Empty;
        }
    }
}
