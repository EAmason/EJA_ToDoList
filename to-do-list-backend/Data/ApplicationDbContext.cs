using Microsoft.EntityFrameworkCore;
using ToDoListBackend.Models;

namespace ToDoListBackend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<TodoTask> Tasks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Make email unique
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<TodoTask>(entity =>
            {
                entity.HasKey(t => t.Id);

                entity.Property(t => t.Name)
                    .IsRequired();

                entity.Property(t => t.DueDate)
                    .IsRequired();

                entity.Property(t => t.Description)
                    .IsRequired(false);

                entity.Property(t => t.EstimateHours)
                    .IsRequired(false);

                entity.Property(t => t.HoursRemaining)
                    .IsRequired(false);

                entity.Property(t => t.Priority)
                    .HasConversion<string>()
                    .IsRequired();

                entity.Property(t => t.Status)
                    .HasConversion<string>()
                    .IsRequired();

                entity.Property(t => t.CompletedAt)
                    .IsRequired(false);

                entity.Property(t => t.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(t => t.User)
                    .WithMany(u => u.Tasks)
                    .HasForeignKey(t => t.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}