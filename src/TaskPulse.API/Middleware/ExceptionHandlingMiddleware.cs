using System.Net;
using System.Text.Json;
using FluentValidation;
using TaskPulse.API.Common;
using TaskPulse.Application.Exceptions;

namespace TaskPulse.API.Middleware;

/// <summary>
/// Global middleware capturing unhandled and domain exceptions,
/// converting them to standardized RFC 7807 / ApiResponse error envelopes.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate _next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        this._next = _next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        ApiResponse<object> response;

        switch (exception)
        {
            case ValidationException validationException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                var errors = validationException.Errors.Select(e => e.ErrorMessage).ToList();
                response = ApiResponse<object>.Fail("Validation failed.", errors);
                _logger.LogWarning(exception, "Validation exception occurred: {Message}", validationException.Message);
                break;

            case UnauthorizedAccessException unauthorizedException:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response = ApiResponse<object>.Fail(unauthorizedException.Message);
                _logger.LogWarning(exception, "Unauthorized access: {Message}", unauthorizedException.Message);
                break;

            case NotFoundException notFoundException:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response = ApiResponse<object>.Fail(notFoundException.Message);
                _logger.LogInformation(exception, "Resource not found: {Message}", notFoundException.Message);
                break;

            case WipLimitExceededException wipException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response = ApiResponse<object>.Fail(wipException.Message);
                _logger.LogWarning(exception, "WIP limit exceeded: {Message}", wipException.Message);
                break;

            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response = ApiResponse<object>.Fail("An unexpected error occurred. Please try again later.");
                _logger.LogError(exception, "Unhandled server exception: {Message}", exception.Message);
                break;
        }

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(response, jsonOptions);
        await context.Response.WriteAsync(json);
    }
}
