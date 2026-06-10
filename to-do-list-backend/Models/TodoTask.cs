using System;

namespace ToDoListBackend.Models
{
    public enum TaskPriority
    {
        Urgent,
        HighPriority,
        MediumPriority,
        LowPriority,
        Optional,
        Reminder
    }

    public enum TaskStatus
    {
        NotStarted,
        InProgress,
        Completed
    }

    public class TodoTask
    {
        public TodoTask()
        {
            CreatedAt = DateTime.UtcNow;
        }

        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public string Name { get; set; }
        public DateTime DueDate { get; set; }
        public string Description { get; set; }
        public TaskPriority Priority { get; set; }

        private int? _estimateHours;
        public int? EstimateHours
        {
            get => _estimateHours;
            set
            {
                _estimateHours = value;
                if (value.HasValue && !HoursRemaining.HasValue)
                {
                    HoursRemaining = value;
                }
            }
        }

        public int? HoursRemaining { get; set; }
        public TaskStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
