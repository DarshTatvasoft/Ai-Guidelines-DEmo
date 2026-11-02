using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TaskPulse.Domain.Interfaces;
using TaskPulse.Infrastructure.Data;
using TaskPulse.Infrastructure.Repositories;

namespace TaskPulse.Infrastructure.Extensions;

/// <summary>
/// Registers all Infrastructure layer services with the DI container.
/// </summary>
public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Register AppDbContext with SQL Server provider
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sqlOptions =>
                {
                    sqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(10),
                        errorNumbersToAdd: null);
                }));

        // Register repositories
        services.AddScoped<IBoardRepository, BoardRepository>();
        services.AddScoped<IColumnRepository, ColumnRepository>();
        services.AddScoped<ITaskRepository, TaskRepository>();
        services.AddScoped<ILabelRepository, LabelRepository>();
        services.AddScoped<IUserRepository, UserRepository>();

        return services;
    }
}

