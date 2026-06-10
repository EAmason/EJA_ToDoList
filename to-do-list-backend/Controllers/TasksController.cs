using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToDoListBackend.Data;
using ToDoListBackend.Models;
using TaskStatus = ToDoListBackend.Models.TaskStatus;

namespace ToDoListBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TasksController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTasks([FromQuery] int userId)
        {
            if (userId <= 0)
            {
                return BadRequest(new { error = "userId query parameter is required." });
            }

            var tasks = await _context.Tasks
                .Where(t => t.UserId == userId)
                .OrderBy(t => t.DueDate)
                .Select(t => MapToDto(t))
                .ToListAsync();

            return Ok(tasks);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound(new { error = "Task not found." });
            }

            return Ok(MapToDto(task));
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.UserId <= 0)
            {
                return BadRequest(new { error = "UserId is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { error = "Name is required." });
            }

            if (request.EstimateHours.HasValue && request.EstimateHours <= 0)
            {
                return BadRequest(new { error = "EstimateHours must be positive." });
            }

            if (request.HoursRemaining.HasValue && request.HoursRemaining < 0)
            {
                return BadRequest(new { error = "HoursRemaining must be zero or positive." });
            }

            var task = new TodoTask
            {
                UserId = request.UserId,
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                DueDate = ToUtc(request.DueDate),
                Priority = request.Priority,
                EstimateHours = request.EstimateHours,
                HoursRemaining = request.HoursRemaining ?? request.EstimateHours,
                Status = request.Status,
                CreatedAt = DateTime.UtcNow,
                CompletedAt = request.Status == TaskStatus.Completed ? DateTime.UtcNow : null
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, MapToDto(task));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound(new { error = "Task not found." });
            }

            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                task.Name = request.Name.Trim();
            }

            if (request.Description != null)
            {
                task.Description = request.Description.Trim();
            }

            if (request.DueDate.HasValue)
            {
                task.DueDate = ToUtc(request.DueDate.Value);
            }

            if (request.Priority.HasValue)
            {
                task.Priority = request.Priority.Value;
            }

            if (request.EstimateHours.HasValue)
            {
                if (request.EstimateHours <= 0)
                {
                    return BadRequest(new { error = "EstimateHours must be positive." });
                }

                task.EstimateHours = request.EstimateHours;
            }

            if (request.HoursRemaining.HasValue)
            {
                if (request.HoursRemaining < 0)
                {
                    return BadRequest(new { error = "HoursRemaining must be zero or positive." });
                }

                task.HoursRemaining = request.HoursRemaining;
            }

            if (request.Status.HasValue)
            {
                task.Status = request.Status.Value;
                if (request.Status == TaskStatus.Completed && !task.CompletedAt.HasValue)
                {
                    task.CompletedAt = DateTime.UtcNow;
                }
                else if (request.Status != TaskStatus.Completed)
                {
                    task.CompletedAt = null;
                }
            }

            task.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(MapToDto(task));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound(new { error = "Task not found." });
            }

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static DateTime ToUtc(DateTime dateTime)
        {
            return dateTime.Kind == DateTimeKind.Utc
                ? dateTime
                : dateTime.ToUniversalTime();
        }

        private static TaskDto MapToDto(TodoTask task)
        {
            return new TaskDto
            {
                Id = task.Id,
                UserId = task.UserId,
                Name = task.Name,
                Description = task.Description,
                DueDate = task.DueDate,
                Priority = task.Priority,
                EstimateHours = task.EstimateHours,
                HoursRemaining = task.HoursRemaining,
                Status = task.Status,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                CompletedAt = task.CompletedAt
            };
        }

        public class TaskDto
        {
            public int Id { get; set; }
            public int UserId { get; set; }
            public string Name { get; set; }
            public string Description { get; set; }
            public DateTime DueDate { get; set; }
            public TaskPriority Priority { get; set; }
            public int? EstimateHours { get; set; }
            public int? HoursRemaining { get; set; }
            public TaskStatus Status { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime? UpdatedAt { get; set; }
            public DateTime? CompletedAt { get; set; }
        }

        public class CreateTaskRequest
        {
            public int UserId { get; set; }
            public string Name { get; set; }
            public string Description { get; set; }
            public DateTime DueDate { get; set; }
            public TaskPriority Priority { get; set; }
            public int? EstimateHours { get; set; }
            public int? HoursRemaining { get; set; }
            public TaskStatus Status { get; set; }
        }

        public class UpdateTaskRequest
        {
            public string Name { get; set; }
            public string Description { get; set; }
            public DateTime? DueDate { get; set; }
            public TaskPriority? Priority { get; set; }
            public int? EstimateHours { get; set; }
            public int? HoursRemaining { get; set; }
            public TaskStatus? Status { get; set; }
        }
    }
}
