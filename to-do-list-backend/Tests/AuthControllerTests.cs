using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MockQueryable.Moq;
using ToDoListBackend.Controllers;
using ToDoListBackend.Data;
using ToDoListBackend.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ToDoListBackend.Tests
{
    public class AuthControllerTests
    {
        private Mock<ApplicationDbContext> CreateMockContext()
        {
            var mockContext = new Mock<ApplicationDbContext>(
                new DbContextOptions<ApplicationDbContext>());
            return mockContext;
        }

        private Mock<IConfiguration> CreateMockConfiguration()
        {
            var mockConfig = new Mock<IConfiguration>();
            mockConfig.Setup(x => x["Jwt:SecretKey"]).Returns("this_is_a_secret_key_that_is_long_enough_for_testing");
            mockConfig.Setup(x => x["Jwt:Issuer"]).Returns("TestIssuer");
            mockConfig.Setup(x => x["Jwt:Audience"]).Returns("TestAudience");
            return mockConfig;
        }

        [Fact]
        public async Task SignUp_WithValidRequest_ReturnsCreatedAtAction()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var mockConfig = CreateMockConfiguration();
            var users = new List<User>();
            var mockDbSet = users.BuildMockDbSet();
            
            mockContext.Setup(c => c.Users).Returns(mockDbSet.Object);
            mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            var controller = new AuthController(mockContext.Object, mockConfig.Object);
            var request = new SignUpRequest
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!"
            };

            // Act
            var result = await controller.SignUp(request);

            // Assert
            Assert.IsType<CreatedAtActionResult>(result);
            Mock.Get(mockDbSet.Object).Verify(m => m.Add(It.IsAny<User>()), Times.Once);
            mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task SignUp_WithMissingFields_ReturnsBadRequest()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var mockConfig = CreateMockConfiguration();
            var controller = new AuthController(mockContext.Object, mockConfig.Object);
            var request = new SignUpRequest
            {
                FirstName = "",
                LastName = "Doe",
                Email = "john@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!"
            };

            // Act
            var result = await controller.SignUp(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        public async Task SignUp_WithMismatchedPasswords_ReturnsBadRequest()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var mockConfig = CreateMockConfiguration();
            var controller = new AuthController(mockContext.Object, mockConfig.Object);
            var request = new SignUpRequest
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john@example.com",
                Password = "Password123!",
                ConfirmPassword = "DifferentPassword!"
            };

            // Act
            var result = await controller.SignUp(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        public async Task SignUp_WithDuplicateEmail_ReturnsBadRequest()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var mockConfig = CreateMockConfiguration();
            var user = new User
            {
                Id = 1,
                FirstName = "John",
                LastName = "Doe",
                Email = "john@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!")
            };
            
            var userList = new List<User> { user };
            var mockDbSet = userList.BuildMockDbSet();            
            mockContext.Setup(c => c.Users).Returns(mockDbSet.Object);

            var controller = new AuthController(mockContext.Object, mockConfig.Object);
            var request = new SignUpRequest
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!"
            };

            // Act
            var result = await controller.SignUp(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        public async Task Login_WithValidCredentials_ReturnsOkWithToken()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var mockConfig = CreateMockConfiguration();

            var user = new User
            {
                Id = 1,
                FirstName = "John",
                LastName = "Doe",
                Email = "john@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!")
            };

            var userList = new List<User> { user };
            var mockDbSet = userList.BuildMockDbSet();
            mockContext.Setup(c => c.Users).Returns(mockDbSet.Object);

            var controller = new AuthController(mockContext.Object, mockConfig.Object);
            var request = new LoginRequest
            {
                Email = "john@example.com",
                Password = "Password123!"
            };

            // Act
            var result = await controller.Login(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            var responseProperty = okResult.Value.GetType().GetProperty("token");
            Assert.NotNull(responseProperty);
        }

        [Fact]
        public async Task Login_WithInvalidEmail_ReturnsUnauthorized()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var mockConfig = CreateMockConfiguration();
            
            // Set the User List as empty.
            var userList = new List<User> {};
            var mockDbSet = userList.BuildMockDbSet();
            mockContext.Setup(c => c.Users).Returns(mockDbSet.Object);

            var controller = new AuthController(mockContext.Object, mockConfig.Object);
            var request = new LoginRequest
            {
                Email = "nonexistent@example.com",
                Password = "Password123!"
            };

            // Act
            var result = await controller.Login(request);

            // Assert
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var mockConfig = CreateMockConfiguration();
            var user = new User
            {
                Id = 1,
                FirstName = "John",
                LastName = "Doe",
                Email = "john@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!")
            };

            var userList = new List<User> { user };
            var mockDbSet = userList.BuildMockDbSet();
            mockContext.Setup(c => c.Users).Returns(mockDbSet.Object);

            var controller = new AuthController(mockContext.Object, mockConfig.Object);
            var request = new LoginRequest
            {
                Email = "john@example.com",
                Password = "WrongPassword!"
            };

            // Act
            var result = await controller.Login(request);

            // Assert
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task Login_WithMissingFields_ReturnsBadRequest()
        {
            // Arrange
            var mockContext = CreateMockContext();
            var mockConfig = CreateMockConfiguration();
            var controller = new AuthController(mockContext.Object, mockConfig.Object);
            var request = new LoginRequest
            {
                Email = "",
                Password = "Password123!"
            };

            // Act
            var result = await controller.Login(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}
