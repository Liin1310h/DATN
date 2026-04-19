using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Domain.Entities;

namespace ExpenseTrackerAPI.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Account> Accounts { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<Loan> Loans { get; set; }
    public DbSet<RepaymentSchedule> RepaymentSchedules { get; set; }
    public DbSet<UserSetting> UserSettings { get; set; }
    public DbSet<Budget> Budgets { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --- Cấu hình Transaction ---
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasOne(t => t.User)
                  .WithMany(u => u.Transactions)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Tài khoản chuyển đi
            entity.HasOne(t => t.FromAccount)
                  .WithMany(a => a.TransactionsFrom)
                  .HasForeignKey(t => t.FromAccountId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Tài khoản nhận/đích
            entity.HasOne(t => t.ToAccount)
                  .WithMany(a => a.TransactionsTo)
                  .HasForeignKey(t => t.ToAccountId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Định dạng tiền tệ
            entity.Property(t => t.Amount).HasPrecision(18, 2);
            entity.Property(t => t.ConvertedAmount).HasPrecision(18, 2);
            entity.Property(t => t.BalanceBefore).HasPrecision(18, 2);
            entity.Property(t => t.BalanceAfter).HasPrecision(18, 2);
        });

        // --- Cấu hình Loan ---
        modelBuilder.Entity<Loan>(entity =>
        {
            entity.Property(l => l.PrincipalAmount).HasPrecision(18, 2);
            entity.Property(l => l.RemainingAmount).HasPrecision(18, 2);

            // Một Loan có nhiều kỳ trả nợ
            entity.HasMany(l => l.Schedules)
                  .WithOne(r => r.Loan)
                  .HasForeignKey(r => r.LoanId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RepaymentSchedule>(entity =>
        {
            entity.Property(r => r.PrincipalAmount).HasPrecision(18, 2);
            entity.Property(r => r.InterestAmount).HasPrecision(18, 2);
            entity.Property(r => r.TotalAmount).HasPrecision(18, 2);
            entity.Property(r => r.RemainingBalance).HasPrecision(18, 2);
        });

        // --- Account ---
        modelBuilder.Entity<Account>(entity =>
        {
            entity.Property(a => a.Balance).HasPrecision(18, 2);

            entity.HasOne(a => a.User)
                  .WithMany(u => u.Accounts)
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // --- User & Settings ---
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<UserSetting>(entity =>
        {
            entity.HasIndex(s => s.UserId).IsUnique();
            entity.Property(s => s.DefaultCurrency).HasMaxLength(3);
            entity.Property(s => s.Language).HasMaxLength(10); // Tăng lên 10 cho an toàn (vi-VN)
            entity.Property(s => s.Theme).HasMaxLength(20);
        });

        modelBuilder.Entity<Budget>(entity =>
        {
            entity.HasIndex(b => new { b.UserId, b.CategoryId, b.Month }).IsUnique();
            entity.Property(b => b.Amount).HasColumnType("numeric(15,2)");
        });

        // --- Dữ liệu Category mặc định ---
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Ăn uống", Icon = "Utensils", Color = "#FF5733", UserId = null },
            new Category { Id = 2, Name = "Di chuyển", Icon = "Car", Color = "#33FF57", UserId = null },
            new Category { Id = 3, Name = "Mua sắm", Icon = "ShoppingBag", Color = "#3357FF", UserId = null },
            new Category { Id = 4, Name = "Lương", Icon = "Banknote", Color = "#22c55e", UserId = null },
            new Category { Id = 5, Name = "Vay nợ", Icon = "Landmark", Color = "#2563eb", UserId = null }
        );
    }
}