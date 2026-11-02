using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using TaskPulse.Application.Interfaces;
using TaskPulse.Application.Services;

namespace TaskPulse.Application.Extensions;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Register FluentValidation validators
        services.AddValidatorsFromAssembly(typeof(ApplicationServiceExtensions).Assembly);

        // Register core services
        services.AddScoped<IBoardService, BoardService>();
        services.AddScoped<IColumnService, ColumnService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<IUserService, UserService>();

        // Register authentication services
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}
