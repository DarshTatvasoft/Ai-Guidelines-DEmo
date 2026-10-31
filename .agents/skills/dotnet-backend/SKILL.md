---
name: dotnet-backend
description: >-
  Skill for building .NET 8 Web API backend with Clean Architecture (4-layer structure).
  Use this skill when creating controllers, services, repositories, entities, DTOs,
  or any backend code following the project's architectural standards.
---

# .NET 8 Backend Development Skill

## Architecture Overview

This project uses a **4-layer Clean Architecture** with .NET 8:

| Layer | Project | Responsibility |
|-------|---------|---------------|
| **API** | `ProjectName.API` | Controllers, DTOs, Middleware, Filters |
| **Application** | `ProjectName.Application` | Services, Interfaces, Validators, Mappings |
| **Infrastructure** | `ProjectName.Infrastructure` | DbContext, Repositories, Migrations, External Services |
| **Domain** | `ProjectName.Domain` | Entities, Enums, Value Objects, Repository Interfaces |

## Dependency Flow

```
API → Application → Domain
         ↓
   Infrastructure → Domain
```

- **Domain** has NO dependencies on other layers
- **Application** depends only on Domain
- **Infrastructure** depends on Domain (implements repository interfaces)
- **API** depends on Application (and registers Infrastructure via DI)

## Step-by-Step: Adding a New Feature

### 1. Domain Entity (ProjectName.Domain/Entities/)

```csharp
public class Customer : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
```

### 2. Repository Interface (ProjectName.Domain/Interfaces/)

```csharp
public interface ICustomerRepository
{
    Task<Customer?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Customer>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Customer> AddAsync(Customer customer, CancellationToken cancellationToken = default);
    Task UpdateAsync(Customer customer, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default);
}
```

### 3. Entity Configuration (ProjectName.Infrastructure/Data/Configurations/)

```csharp
public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("Customers");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(c => c.LastName).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Email).IsRequired().HasMaxLength(256);
        builder.HasIndex(c => c.Email).IsUnique();
        builder.HasQueryFilter(c => !c.IsDeleted);
    }
}
```

### 4. Repository Implementation (ProjectName.Infrastructure/Repositories/)

```csharp
public class CustomerRepository : ICustomerRepository
{
    private readonly AppDbContext _context;

    public CustomerRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Customer?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }
    // ... other methods
}
```

### 5. Service Interface & Implementation (ProjectName.Application/)

```csharp
// Interfaces/ICustomerService.cs
public interface ICustomerService
{
    Task<CustomerResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<CustomerResponseDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<CustomerResponseDto> CreateAsync(CreateCustomerDto dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(int id, UpdateCustomerDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}

// Services/CustomerService.cs
public class CustomerService : ICustomerService
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<CustomerService> _logger;

    public CustomerService(
        ICustomerRepository customerRepository,
        IMapper mapper,
        ILogger<CustomerService> logger)
    {
        _customerRepository = customerRepository;
        _mapper = mapper;
        _logger = logger;
    }
    // ... implementation
}
```

### 6. DTOs (ProjectName.Application/DTOs/ or ProjectName.API/DTOs/)

```csharp
public record CreateCustomerDto(string FirstName, string LastName, string Email);
public record UpdateCustomerDto(string FirstName, string LastName, string Email);
public record CustomerResponseDto(int Id, string FirstName, string LastName, string Email, bool IsActive);
```

### 7. Validator (ProjectName.Application/Validators/)

```csharp
public class CreateCustomerDtoValidator : AbstractValidator<CreateCustomerDto>
{
    public CreateCustomerDtoValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
    }
}
```

### 8. Controller (ProjectName.API/Controllers/)

```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var customer = await _customerService.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<CustomerResponseDto>.Success(customer));
    }
    // ... other actions
}
```

### 9. Register Dependencies (ProjectName.Infrastructure/Extensions/)

```csharp
public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<ICustomerRepository, CustomerRepository>();
        return services;
    }
}
```

## Coding Conventions

- **Async all the way**: Every I/O method must be async with `Async` suffix
- **CancellationToken**: Pass through all async methods
- **Null safety**: Nullable reference types enabled; handle nulls explicitly
- **No magic strings**: Use constants or configuration
- **Exception handling**: Custom exceptions → Global exception middleware
- **Logging**: `ILogger<T>` with structured logging; never log PII/secrets
- **Response format**: Always use `ApiResponse<T>` wrapper

## Common Packages

- `Microsoft.EntityFrameworkCore.SqlServer` — EF Core SQL Server provider
- `Microsoft.EntityFrameworkCore.Tools` — EF Core CLI tools
- `AutoMapper.Extensions.Microsoft.DependencyInjection` — Object mapping
- `FluentValidation.AspNetCore` — Input validation
- `Serilog.AspNetCore` — Structured logging
- `Swashbuckle.AspNetCore` — Swagger/OpenAPI

## ⚠️ Before You Code

1. Check if the entity/feature already exists
2. Follow the layer hierarchy — never skip layers
3. All database changes require explicit user approval (see Database Management skill)
4. All Git operations require explicit user approval (see Git Operations skill)

