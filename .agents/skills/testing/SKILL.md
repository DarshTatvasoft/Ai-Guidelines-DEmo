---
name: testing
description: >-
  Skill for writing and running tests across backend (.NET/xUnit) and frontend (Angular/Jest).
  Covers unit tests, integration tests, test patterns, and coverage requirements.
  Use this skill when creating, updating, or running tests.
---

# Testing Skill — Backend & Frontend

## Testing Philosophy (per TVS-DEV-AI-GL-01)

- **All AI-generated code must be tested before commit**
- **Tests verify behavior, not implementation details**
- **Testing ideally requires same or higher model tier than development**
- **For normal/complex work, use a separate agent or fresh context for independent review**
- **Never treat "Agent completed successfully" as "implementation is correct"**

---

## Backend Testing (.NET 8 / xUnit)

### Test Project Structure

```
tests/
├── ProjectName.API.Tests/              # Integration tests
│   ├── Controllers/
│   │   └── CustomersControllerTests.cs
│   └── TestFixtures/
│       └── CustomWebApplicationFactory.cs
│
├── ProjectName.Application.Tests/       # Unit tests (business logic)
│   ├── Services/
│   │   └── CustomerServiceTests.cs
│   └── Validators/
│       └── CreateCustomerDtoValidatorTests.cs
│
└── ProjectName.Infrastructure.Tests/    # Repository/data tests
    └── Repositories/
        └── CustomerRepositoryTests.cs
```

### Test Naming Convention

```
MethodName_Scenario_ExpectedResult
```

Examples:
- `GetByIdAsync_ExistingId_ReturnsCustomer`
- `GetByIdAsync_NonExistingId_ReturnsNull`
- `CreateAsync_DuplicateEmail_ThrowsConflictException`
- `CreateAsync_ValidInput_ReturnsCreatedCustomer`
- `DeleteAsync_ExistingId_SetsIsDeletedTrue`

### Unit Test Pattern (Service Layer)

```csharp
public class CustomerServiceTests
{
    private readonly Mock<ICustomerRepository> _mockRepo;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<ILogger<CustomerService>> _mockLogger;
    private readonly CustomerService _sut; // System Under Test

    public CustomerServiceTests()
    {
        _mockRepo = new Mock<ICustomerRepository>();
        _mockMapper = new Mock<IMapper>();
        _mockLogger = new Mock<ILogger<CustomerService>>();
        _sut = new CustomerService(_mockRepo.Object, _mockMapper.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsCustomerDto()
    {
        // Arrange
        var customer = new Customer { Id = 1, FirstName = "John", LastName = "Doe", Email = "john@test.com" };
        var expectedDto = new CustomerResponseDto(1, "John", "Doe", "john@test.com", true);

        _mockRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(customer);
        _mockMapper.Setup(m => m.Map<CustomerResponseDto>(customer))
            .Returns(expectedDto);

        // Act
        var result = await _sut.GetByIdAsync(1);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(1);
        result.Email.Should().Be("john@test.com");
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ThrowsNotFoundException()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Customer?)null);

        // Act
        var act = () => _sut.GetByIdAsync(999);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Customer*999*");
    }

    [Theory]
    [InlineData("", "Doe", "john@test.com")]
    [InlineData("John", "", "john@test.com")]
    [InlineData("John", "Doe", "")]
    [InlineData("John", "Doe", "invalid-email")]
    public async Task CreateAsync_InvalidInput_ThrowsValidationException(
        string firstName, string lastName, string email)
    {
        // Arrange
        var dto = new CreateCustomerDto(firstName, lastName, email);

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _sut.CreateAsync(dto));
    }
}
```

### Integration Test Pattern (Controller Layer)

```csharp
public class CustomersControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public CustomersControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetById_ExistingCustomer_Returns200WithData()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/customers/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadFromJsonAsync<ApiResponse<CustomerResponseDto>>();
        content!.Success.Should().BeTrue();
        content.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task GetById_NonExistingCustomer_Returns404()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/customers/99999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Create_ValidCustomer_Returns201()
    {
        // Arrange
        var request = new CreateCustomerDto("Jane", "Smith", "jane@test.com");

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/customers", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}
```

### Required Packages

```xml
<PackageReference Include="xunit" />
<PackageReference Include="xunit.runner.visualstudio" />
<PackageReference Include="Moq" />
<PackageReference Include="FluentAssertions" />
<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" />
<PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" />
```

### Running Tests

```bash
# Run all tests
dotnet test

# Run specific project
dotnet test tests/ProjectName.Application.Tests

# With coverage
dotnet test --collect:"XPlat Code Coverage"

# With verbosity
dotnet test --verbosity detailed
```

---

## Frontend Testing (Angular 22 / Jest)

### Test File Location

Tests are co-located with source files:
```
customer-list.component.ts
customer-list.component.spec.ts
```

### Component Test Pattern

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CustomerListComponent } from './customer-list.component';
import { CustomerService } from '../../services/customer.service';

describe('CustomerListComponent', () => {
  let component: CustomerListComponent;
  let fixture: ComponentFixture<CustomerListComponent>;
  let customerService: jest.Mocked<CustomerService>;

  beforeEach(async () => {
    const mockCustomerService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CustomerService, useValue: mockCustomerService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
    component = fixture.componentInstance;
    customerService = TestBed.inject(CustomerService) as jest.Mocked<CustomerService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load customers on init', () => {
    const mockCustomers = [
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', isActive: true },
    ];

    customerService.getAll.mockReturnValue(of({ success: true, data: mockCustomers, message: '', errors: [] }));

    fixture.detectChanges();

    expect(component.customers()).toEqual(mockCustomers);
    expect(component.isLoading()).toBe(false);
  });

  it('should filter customers by search term', () => {
    component.customers.set([
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', isActive: true },
      { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', isActive: true },
    ]);

    component.searchTerm.set('jane');

    expect(component.filteredCustomers()).toHaveLength(1);
    expect(component.filteredCustomers()[0].firstName).toBe('Jane');
  });

  it('should handle error when loading fails', () => {
    customerService.getAll.mockReturnValue(throwError(() => new Error('Network error')));

    fixture.detectChanges();

    expect(component.error()).toBe('Failed to load customers');
    expect(component.isLoading()).toBe(false);
  });
});
```

### Service Test Pattern

```typescript
describe('CustomerService', () => {
  let service: CustomerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomerService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CustomerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all customers', () => {
    const mockResponse = { success: true, data: [], message: '', errors: [] };

    service.getAll().subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne('/api/v1/customers');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
```

### Running Frontend Tests

```bash
# Run all tests
ng test

# With coverage
ng test --code-coverage

# Single run (CI)
ng test --watch=false --browsers=ChromeHeadless
```

---

## Coverage Requirements

| Area | Minimum Coverage |
|------|-----------------|
| Business Logic (Services) | 80% |
| Critical Paths (Auth, Payments) | 100% |
| Controllers/API | 70% |
| Components (Angular) | 70% |
| Shared Services (Angular) | 80% |
| Utilities/Helpers | 90% |

## Test Checklist Before Commit

- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Edge cases covered (null, empty, boundary values)
- [ ] Error scenarios tested
- [ ] No test depends on other tests or external state
- [ ] No hardcoded test data that could break (dates, IDs)
- [ ] Mocks/stubs properly set up and verified

