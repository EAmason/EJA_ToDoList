using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MockQueryable.Moq;
using ToDoListBackend.Controllers;
using ToDoListBackend.Data;
using ToDoListBackend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using static ToDoListBackend.Controllers.TasksController;
using TaskStatus = ToDoListBackend.Models.TaskStatus;

namespace ToDoListBackend.Tests
{
    public class TasksControllerTests
    {
        private Mock<ApplicationDbContext> CreateMockContext()
        {
            var mockContext = new Mock<ApplicationDbContext>(
                new DbContextOptions<ApplicationDbContext>());
            return mockContext;
        }

        [Fact]
        public async Task GetTasks_WithValidUserId_ReturnsOkWithTasks()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var tasks = new List<TodoTask>
            {
                new TodoTask
                {
                    Id = 1,
                    UserId = 1,
                    Name = "Task 1",
                    Description = "Description 1",
                    DueDate = DateTime.UtcNow.AddDays(1),
                    Priority = TaskPriority.HighPriority,
                    EstimateHours = 5,
                    HoursRemaining = 3,
                    Status = TaskStatus.InProgress,
                    CreatedAt = DateTime.UtcNow
                }
            };

            var mockDbSet = tasks.BuildMockDbSet();
            mockContext.Setup(c => c.Tasks).Returns(mockDbSet.Object);

            var controller = new TasksController(mockContext.Object);

            // Act
            var result = await controller.GetTasks(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetTasks_WithInvalidUserId_ReturnsBadRequest()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var controller = new TasksController(mockContext.Object);

            // Act
            var result = await controller.GetTasks(0);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task GetTask_WithValidId_ReturnsOkWithTask()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var task = new TodoTask
            {
                Id = 1,
                UserId = 1,
                Name = "Task 1",
                Description = "Description 1",
                DueDate = DateTime.UtcNow.AddDays(1),
                Priority = TaskPriority.MediumPriority,
                EstimateHours = 5,
                HoursRemaining = 3,
                Status = TaskStatus.InProgress,
                CreatedAt = DateTime.UtcNow
            };
            
            var tasks = new List<TodoTask> { task };
            var mockDbSet = tasks.BuildMockDbSet();

            mockDbSet.Setup(x => x.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
                .Returns((object[] ids, CancellationToken token) => new ValueTask<TodoTask>(task));

            mockDbSet.Setup(x => x.FindAsync(It.IsAny<object[]>()))
                .ReturnsAsync((object[] ids) => task);

            mockContext.Setup(c => c.Tasks).Returns(mockDbSet.Object);

            var controller = new TasksController(mockContext.Object);

            // Act
            var result = await controller.GetTask(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            var returnedTask = Assert.IsType<TaskDto>(okResult.Value);
            Assert.Equal("Task 1", returnedTask.Name);
        }

        [Fact]
        public async Task GetTask_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            var mockContext = CreateMockContext();
            mockContext.Setup(c => c.Tasks.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((TodoTask)null);

            var controller = new TasksController(mockContext.Object);

            // Act
            var result = await controller.GetTask(999);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task CreateTask_WithValidRequest_ReturnsCreatedAtAction()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var mockDbSet = new Mock<DbSet<TodoTask>>();
            var tasks = new List<TodoTask>();

            mockDbSet.Setup(m => m.Add(It.IsAny<TodoTask>())).Callback<TodoTask>(t => tasks.Add(t));
            mockContext.Setup(c => c.Tasks).Returns(mockDbSet.Object);
            mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            var controller = new TasksController(mockContext.Object);
            var request = new CreateTaskRequest
            {
                UserId = 1,
                Name = "New Task",
                Description = "Task Description",
                DueDate = DateTime.UtcNow.AddDays(1),
                Priority = TaskPriority.HighPriority,
                EstimateHours = 8,
                HoursRemaining = 8,
                Status = TaskStatus.NotStarted
            };

            // Act
            var result = await controller.CreateTask(request);

            // Assert
            Assert.IsType<CreatedAtActionResult>(result);
            mockDbSet.Verify(m => m.Add(It.IsAny<TodoTask>()), Times.Once);
        }

        [Fact]
        public async Task CreateTask_WithInvalidUserId_ReturnsBadRequest()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var controller = new TasksController(mockContext.Object);
            var request = new CreateTaskRequest
            {
                UserId = 0,
                Name = "New Task",
                Description = "Task Description",
                DueDate = DateTime.UtcNow.AddDays(1),
                Priority = TaskPriority.MediumPriority,
                EstimateHours = 5,
                Status = TaskStatus.NotStarted
            };

            // Act
            var result = await controller.CreateTask(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task CreateTask_WithEmptyName_ReturnsBadRequest()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var controller = new TasksController(mockContext.Object);
            var request = new CreateTaskRequest
            {
                UserId = 1,
                Name = "",
                Description = "Task Description",
                DueDate = DateTime.UtcNow.AddDays(1),
                Priority = TaskPriority.MediumPriority,
                EstimateHours = 5,
                Status = TaskStatus.NotStarted
            };

            // Act
            var result = await controller.CreateTask(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task CreateTask_WithNegativeEstimateHours_ReturnsBadRequest()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var controller = new TasksController(mockContext.Object);
            var request = new CreateTaskRequest
            {
                UserId = 1,
                Name = "New Task",
                Description = "Task Description",
                DueDate = DateTime.UtcNow.AddDays(1),
                Priority = TaskPriority.MediumPriority,
                EstimateHours = -5,
                Status = TaskStatus.NotStarted
            };

            // Act
            var result = await controller.CreateTask(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UpdateTask_WithValidRequest_ReturnsOk()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var task = new TodoTask
            {
                Id = 1,
                UserId = 1,
                Name = "Original Task",
                Description = "Original Description",
                DueDate = DateTime.UtcNow.AddDays(1),
                Priority = TaskPriority.MediumPriority,
                EstimateHours = 5,
                HoursRemaining = 3,
                Status = TaskStatus.NotStarted,
                CreatedAt = DateTime.UtcNow
            };

            var tasks = new List<TodoTask> { task };
            var mockDbSet = tasks.BuildMockDbSet();

            mockDbSet.Setup(x => x.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
                .Returns((object[] ids, CancellationToken token) => new ValueTask<TodoTask>(task));

            mockDbSet.Setup(x => x.FindAsync(It.IsAny<object[]>()))
                .ReturnsAsync((object[] ids) => task);

            mockContext.Setup(c => c.Tasks).Returns(mockDbSet.Object);

            var controller = new TasksController(mockContext.Object);
            var request = new UpdateTaskRequest
            {
                Name = "Updated Task",
                Description = "Updated Description",
                Priority = TaskPriority.HighPriority,
                EstimateHours = 8,
                HoursRemaining = 5,
                Status = TaskStatus.InProgress
            };

            // Act
            var result = await controller.UpdateTask(1, request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            Assert.Equal("Updated Task", task.Name);
        }

        [Fact]
        public async Task UpdateTask_WithInvalidTaskId_ReturnsNotFound()
        {
            // Arrange
            var mockContext = CreateMockContext();
            mockContext.Setup(c => c.Tasks.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((TodoTask)null);

            var controller = new TasksController(mockContext.Object);
            var request = new UpdateTaskRequest
            {
                Name = "Updated Task"
            };

            // Act
            var result = await controller.UpdateTask(999, request);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task UpdateTask_WithNegativeHoursRemaining_ReturnsBadRequest()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var task = new TodoTask
            {
                Id = 1,
                UserId = 1,
                Name = "Task 1",
                Status = TaskStatus.InProgress,
                CreatedAt = DateTime.UtcNow
            };

            var tasks = new List<TodoTask> { task };
            var mockDbSet = tasks.BuildMockDbSet();

            mockDbSet.Setup(x => x.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
                .Returns((object[] ids, CancellationToken token) => new ValueTask<TodoTask>(task));

            mockDbSet.Setup(x => x.FindAsync(It.IsAny<object[]>()))
                .ReturnsAsync((object[] ids) => task);

            mockContext.Setup(c => c.Tasks).Returns(mockDbSet.Object);
            var controller = new TasksController(mockContext.Object);
            var request = new UpdateTaskRequest
            {
                HoursRemaining = -5
            };

            // Act
            var result = await controller.UpdateTask(1, request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UpdateTask_ToCompletedStatus_SetCompletedAt()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var task = new TodoTask
            {
                Id = 1,
                UserId = 1,
                Name = "Task 1",
                Status = TaskStatus.InProgress,
                CreatedAt = DateTime.UtcNow,
                CompletedAt = null
            };

            var tasks = new List<TodoTask> { task };
            var mockDbSet = tasks.BuildMockDbSet();

            mockDbSet.Setup(x => x.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
                .Returns((object[] ids, CancellationToken token) => new ValueTask<TodoTask>(task));

            mockDbSet.Setup(x => x.FindAsync(It.IsAny<object[]>()))
                .ReturnsAsync((object[] ids) => task);

            mockContext.Setup(c => c.Tasks).Returns(mockDbSet.Object);

            mockContext.Setup(c => c.Tasks).Returns(mockDbSet.Object);
            mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            var controller = new TasksController(mockContext.Object);
            var request = new UpdateTaskRequest
            {
                Status = TaskStatus.Completed
            };

            // Act
            var result = await controller.UpdateTask(1, request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(task.CompletedAt);
            Assert.Equal(TaskStatus.Completed, task.Status);
        }

        [Fact]
        public async Task DeleteTask_WithValidId_ReturnsNoContent()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var task = new TodoTask
            {
                Id = 1,
                UserId = 1,
                Name = "Task to Delete",
                CreatedAt = DateTime.UtcNow
            };

            var tasks = new List<TodoTask> { task };
            var mockDbSet = tasks.BuildMockDbSet();

            mockDbSet.Setup(x => x.FindAsync(It.IsAny<object[]>()))
                .ReturnsAsync((object[] ids) => tasks.FirstOrDefault(x => x.Id == (int)ids[0]));

            mockContext.Setup(c => c.Tasks).Returns(mockDbSet.Object);
            mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            var controller = new TasksController(mockContext.Object);

            // Act
            var result = await controller.DeleteTask(1);

            // Assert
            Assert.IsType<NoContentResult>(result);
            mockDbSet.Verify(m => m.Remove(task), Times.Once);
        }

        [Fact]
        public async Task DeleteTask_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var mockDbSet = new Mock<DbSet<TodoTask>>();
            
            mockDbSet.Setup(m => m.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((TodoTask)null);

            mockContext.Setup(c => c.Tasks).Returns(mockDbSet.Object);

            var controller = new TasksController(mockContext.Object);

            // Act
            var result = await controller.DeleteTask(999);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
            mockDbSet.Verify(m => m.Remove(It.IsAny<TodoTask>()), Times.Never);
        }
    }
}
