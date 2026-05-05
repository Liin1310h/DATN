using ExpenseTrackerAPI.API.Hubs;
using ExpenseTrackerAPI.Application.Interfaces;
using ExpenseTrackerAPI.Application.Interfaces.Admin;
using ExpenseTrackerAPI.Application.Interfaces.AI;
using ExpenseTrackerAPI.Application.Interfaces.Auth;
using ExpenseTrackerAPI.Application.Interfaces.Notifications;
using ExpenseTrackerAPI.Application.Interfaces.User;
using ExpenseTrackerAPI.Application.Services;
using ExpenseTrackerAPI.Application.Services.Admin;
using ExpenseTrackerAPI.Application.Services.AI;
using ExpenseTrackerAPI.Application.Services.Auth;
using ExpenseTrackerAPI.Application.Services.Users;
using ExpenseTrackerAPI.Domain.Interfaces.Notifications;
using ExpenseTrackerAPI.Infrastructure.Data;
using ExpenseTrackerAPI.Infrastructure.Services;
using ExpenseTrackerAPI.Services.User;
using Hangfire;
using Hangfire.MemoryStorage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// DANH SÁCH SERVICE
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

// Kết nối DB
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));
// Xác thực
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? throw new Exception("Không thấy JWT Key"))
        )
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];

            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) &&
                path.StartsWithSegments("/hubs/notifications"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});
// Phân quyền
builder.Services.AddAuthorization();

builder.Services.AddHttpContextAccessor();
// Đăng ký service
//---User---
builder.Services.AddMemoryCache();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISettingsService, SettingsService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();

builder.Services.AddHttpClient<ICurrencyService, CurrencyService>();
builder.Services.AddScoped<ILoanService, LoanService>();
builder.Services.AddScoped<ILoanReminderService, LoanReminderService>();
builder.Services.AddScoped<IBudgetService, BudgetService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

builder.Services.AddScoped<IReceiptParserService, ReceiptParserService>();
builder.Services.AddScoped<IReceiptProcessingService, ReceiptProcessingService>();

//---Admin---
builder.Services.AddScoped<IAdminDashboardService, AdminDashboardService>();
builder.Services.AddScoped<IAdminUserService, AdminUserService>();
builder.Services.AddScoped<IAdminCategoryService, AdminCategoryService>();

//---AI---
builder.Services.AddScoped<ICategoryPredictionService, CategoryPredictionService>();
builder.Services.AddScoped<IPersonalCategoryRuleService, PersonalCategoryRuleService>();
builder.Services.AddHttpClient<IGlobalCategoryMlService, GlobalCategoryMlService>(client =>
{
    client.BaseAddress = new Uri("http://localhost:8001");
});
builder.Services.AddHttpClient<ISemanticCategoryService, SemanticCategoryService>(client =>
{
    client.BaseAddress = new Uri("http://localhost:8001");
});
builder.Services.AddHttpClient<IAIReceiptParser, AIReceiptParser>((sp, client) =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var apiKey = config["OpenAI:ApiKey"];

    client.BaseAddress = new Uri("https://api.openai.com/");

    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
});

//---Notification---
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IPushNotificationService, PushNotificationService>();

// Hangfire config
builder.Services.AddHangfire(config =>
{
    config.UseMemoryStorage();
});
builder.Services.AddHangfireServer();


var app = builder.Build();

// Hangfire Dashboard
app.UseHangfireDashboard("/hangfire");

//TODO Đăng ký job nhắc hạn khoản vay định kỳ
//Mỗi 1h sẽ chạy ProcessReminderAsync để kiểm tra và gửi nhắc hạn cho user
Hangfire.RecurringJob.AddOrUpdate<ILoanReminderService>(
    "loan-reminder-job",
    x => x.ProcessReminderAsync(),
    Hangfire.Cron.Hourly
);


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("hubs/notifications");

app.Run();