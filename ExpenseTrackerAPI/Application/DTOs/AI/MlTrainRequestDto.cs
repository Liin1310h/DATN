namespace ExpenseTrackerAPI.Application.Interfaces.AI;

public class MlTrainRequestDto
{
    public List<MlTrainingItemDto> Data { get; set; } = new();
}