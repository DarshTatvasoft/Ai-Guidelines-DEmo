# Project Instructions — TaskPulse

> **Project**: TaskPulse — Full-Stack Task Board Application  
> **Document Reference**: TVS-DEV-AI-GL-01 AI Development Tools Guidelines v1.0  
> **AI Champion**: [Assign team member name here]  
> **Last Updated**: 2026-10-31  

---

## 🎯 Purpose & Demo Context

**TaskPulse** is a full-stack task board application (boards, task lists/columns, cards, assignees, priorities, labels) designed as a flagship reference project for an **AI-Assisted Development Demo**.

This project explicitly showcases:
1. **MCP (Model Context Protocol) Integration**:
   - **Jira MCP**: Pulling requirements, acceptance criteria, issue keys, and statuses directly into development context.
   - **Figma MCP**: Inspecting task board designs, design tokens, responsive layouts, and UI states for pixel-accurate frontend implementation.
2. **Context Window Management (TVS-DEV-AI-GL-01.2)**:
   - One task per chat — clear the slate when switching tasks or when debugging gets noisy.
   - Reference files with paths (`@file`) rather than pasting entire codebases into prompts.
   - Target minimal code edits instead of full-file reprints.
   - Project persistent rules locked in this `AGENTS.md` file rather than repeated in conversation.
3. **Structured Development Phases (TVS-DEV-AI-GL-01.6)**:
   - **Explore / Understand** (Read-only, verify understanding, no edits)
   - **Plan** (Read-only, specify steps, files, edge cases, tests; get human approval)
   - **Implement** (Approved plan only, small steps, review diffs)
   - **Check / Review** (Full diff review, build, tests, code review)
   - **Debug** (Evidence-based targeted fixes, only when something fails)
4. **Strict Constraints**:
   - **NO SECRETS** in code, configs, or prompts (use user secrets/env vars with placeholder tokens).
   - **MINIMUM REQUIRED CHANGES**: Never perform unrelated refactoring, styling reformatting, or unsolicited package upgrades.
   - **NO APPLICATION CODE YET**: Only setup and governance instructions until development phases are initiated.

---

## 🏗️ Tech Stack & Architectural Boundaries

- **Backend**: .NET 8 Web API (C#) — 4-Layer Clean Architecture with EF Core Code-First.
- **Frontend**: Angular 22 with TypeScript — Industrial-standard feature-based architecture (Signals, Standalone components, OnPush).
- **Database**: Microsoft SQL Server (via EF Core Code-First migrations with soft deletes).
- **Testing**: xUnit + Moq + FluentAssertions for .NET; Jest + Angular Testing Library for Angular.

---

## 📐 Architecture — Backend (.NET 8 Clean Architecture)

The solution is divided into a strict **4-layer Clean Architecture**:

```
TaskPulse/
├── src/
│   ├── TaskPulse.API/                  # Presentation Layer — Controllers, Middleware, DTOs
│   │   ├── Controllers/                # Thin endpoints: BoardsController, TasksController
│   │   ├── Middleware/                 # Global error handling, Auth, Logging
│   │   ├── DTOs/                       # External Request/Response contracts
│   │   ├── Filters/                    # Action/Validation filters
│   │   ├── Extensions/                 # Service registration extensions (DI)
│   │   └── Program.cs
│   │
│   ├── TaskPulse.Application/          # Business Logic Layer — Services, Interfaces, Validators
│   │   ├── Services/                   # BoardService, TaskService, ColumnService
│   │   ├── Interfaces/                 # IBoardService, ITaskService
│   │   ├── DTOs/                       # Internal DTOs / View Models
│   │   ├── Validators/                 # FluentValidation rules
│   │   ├── Mappings/                   # AutoMapper profiles
│   │   ├── Exceptions/                 # NotFoundException, ValidationException
│   │   └── Common/                     # Shared constants, enums
│   │
│   ├── TaskPulse.Infrastructure/       # Data Access Layer — EF Core, Repositories, Migrations
│   │   ├── Data/                       # AppDbContext, Configurations
│   │   │   ├── AppDbContext.cs
│   │   │   └── Configurations/         # IEntityTypeConfiguration<T> (Fluent API)
│   │   ├── Repositories/               # BoardRepository, TaskRepository
│   │   ├── Migrations/                 # Auto-generated EF Core migrations
│   │   └── Extensions/                 # Infrastructure DI registration
│   │
│   └── TaskPulse.Domain/               # Domain Layer — Enterprise Entities, Value Objects
│       ├── Entities/                   # Board, Column, TaskItem, Label, User
│       ├── Enums/                      # TaskPriority, TaskStatus
│       ├── Common/                     # BaseEntity (Id, Audit fields, IsDeleted)
│       └── Interfaces/                 # IBoardRepository, ITaskRepository
│
├── tests/
│   ├── TaskPulse.API.Tests/            # Integration tests (WebApplicationFactory)
│   ├── TaskPulse.Application.Tests/    # Unit tests (Business logic, Validators)
│   └── TaskPulse.Infrastructure.Tests/ # Data access tests
│
├── docs/                               # Architecture decisions, ADRs
└── ai-change-log.md                    # Notable AI-assisted changes
```

### Backend Coding Standards
- **Controllers**: Thin controllers only — receive request, invoke application service, return wrapped response (`ApiResponse<T>`). No business logic.
- **Services**: All business rules reside here. Always code against interfaces (`IXxxService`).
- **Repositories**: Repository pattern with Unit of Work. Code against interfaces (`IXxxRepository`).
- **Dependency Injection**: Registered via layer-specific extension methods (`AddApplicationServices()`, `AddInfrastructureServices()`), never crowded in `Program.cs`.
- **Validation**: FluentValidation at application/API boundary before reaching domain services.
- **Async/Await**: All database and I/O operations must be asynchronous with `Async` suffix and receive `CancellationToken`.
- **Data Protection**: Nullable reference types enabled; never log sensitive data or PII.

### Database (EF Core Code-First Rules)
- All entities inherit from `BaseEntity` (`Id`, `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`, `IsDeleted`, `DeletedAt`).
- **Fluent API exclusively** (`IEntityTypeConfiguration<T>`) — do NOT use data annotations on domain entities.
- Foreign keys, cascades, indexes (e.g., unique constraints) must be explicitly configured.
- **Soft deletes only**: Default query filter `HasQueryFilter(e => !e.IsDeleted)`. Never execute hard deletes.

---

## 📐 Architecture — Frontend (Angular 22 Industrial Standard)

The frontend follows a scalable, feature-based Angular 22 architecture:

```
src/
├── app/
│   ├── core/                           # Singleton services, auth guards, interceptors
│   │   ├── services/                   # AuthService, NotificationService
│   │   ├── guards/                     # AuthGuard, CanDeactivateGuard
│   │   ├── interceptors/               # AuthInterceptor, HttpErrorInterceptor
│   │   └── models/                     # Core API models (ApiResponse<T>, UserProfile)
│   │
│   ├── shared/                         # Reusable UI components, pipes, directives
│   │   ├── components/                 # ConfirmModal, Avatar, Badge, LoadingSpinner
│   │   ├── directives/                 # ClickOutsideDirective, DragDropDirective
│   │   └── pipes/                      # FormatDatePipe, TruncatePipe
│   │
│   ├── features/                       # Lazy-loaded business features
│   │   └── task-board/                 # Board feature
│   │       ├── components/             # BoardColumn, TaskCard, TaskDialog
│   │       ├── services/               # BoardService, TaskService
│   │       ├── models/                 # Board, TaskCard, Column models
│   │       ├── pages/                  # BoardPageComponent
│   │       └── task-board.routes.ts
│   │
│   ├── layouts/                        # Shell layouts (MainLayout, AuthLayout)
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
│
├── environments/                       # environment.ts (No hardcoded URLs)
└── styles/                             # Global SCSS, design tokens, BEM utilities
```

### Frontend Coding Standards
- **Standalone Components**: 100% standalone components (no `NgModule`).
- **State Management**: Angular Signals (`signal()`, `computed()`, `effect()`) for local and shared state.
- **Change Detection**: Strict `ChangeDetectionStrategy.OnPush` on every component.
- **Typed Forms**: Strictly-typed reactive forms (`fb.nonNullable.group()`).
- **Modern DI**: Use `inject()` function instead of constructor parameters.
- **Routing**: Lazy loading for all feature routes.
- **Styles**: SCSS scoped to components; design tokens mapped to CSS variables.

---

## 🧪 Testing Standards

### Backend (.NET 8)
- Frameworks: `xUnit`, `Moq`, `FluentAssertions`.
- Structure: AAA (Arrange, Act, Assert).
- Naming: `MethodName_Scenario_ExpectedResult` (e.g., `CreateTask_InvalidBoardId_ThrowsNotFoundException`).
- Coverage: 80%+ on Application logic, 100% on critical paths (authorization, status transitions).

### Frontend (Angular 22)
- Frameworks: `Jest` (or Vitest) + Angular Testing Library.
- Co-located `.spec.ts` files for every component and service.
- Naming: `should [expected behavior] when [condition]`.
- Isolated mocks for `HttpClient` via `provideHttpClientTesting()`.

---

## 🔒 Safety & Mandatory Approvals

### ⚠️ Git Operations — Explicit Confirmation Required
You MUST pause, describe the exact command, explain impact and risks, and wait for human approval before running ANY Git command:
- `git commit`
- `git push`
- `git checkout` / `git switch`
- `git merge` / `git rebase`
- `git reset` / `git stash`
- Destructive operations (`--force`, `reset --hard`) require triple confirmation.

### ⚠️ Database Operations — Explicit Confirmation Required
You MUST pause, describe the exact schema change, explain impact on existing data, show the migration SQL, and wait for human approval before running:
- Creating or editing entities / Fluent API configurations
- `dotnet ef migrations add`
- `dotnet ef database update`
- Any schema-modifying or seed SQL script.

---

## 🔐 Data Privacy & Context Governance

- **Never include secrets, credentials, API keys, or personal data** in prompts, code, or logs.
- Use `appsettings.Development.json` placeholders or User Secrets locally.
- Keep prompt contexts tight: reference files by path, do not dump full files.
- Keep one task per conversation turn; log major milestones in `ai-change-log.md`.
- **Do not write application code yet** until an explicit development task is assigned.
