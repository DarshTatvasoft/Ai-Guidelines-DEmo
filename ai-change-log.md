# AI Change Log

> Record of notable AI-assisted changes to the codebase.
> Required by TVS-DEV-AI-GL-01.3 Mandatory AI Usage Guidelines.

---

<!-- Add entries in reverse chronological order -->

## [2026-11-01] — [FE] TaskPulse Responsive Public Landing Page & Root Route (Jira: TAS-1)

- **Files / Systems Touched**: `src/app/features/landing/pages/landing-page/`, `src/app/app.routes.ts`, `src/styles.scss`
- **AI Tool Used**: Antigravity (Gemini 3.8 Flash)
- **Reviewed By**: Darsh Aswani
- **Notes**: 
  - **Landing Component**: Built `LandingPageComponent` as a public welcome and marketing page introducing TaskPulse's Kanban features, Signals reactivity, Clean Architecture, and Figma/Jira MCP readiness.
  - **Header & Navigation**: Sticky blur header with brand icon, smooth navigation links to page sections (`#features`, `#stack`), and session-aware CTA buttons ("Sign In" / "Get Started" for guests, "Open Board" for authenticated users).
  - **Hero & Mockup Preview**: Dynamic headline with gradient typography, subtitle, and an interactive Kanban board preview mockup with columns, cards, priority tags, and avatar indicators.
  - **Core Pillars & Tech Stack Grid**: Showcases four architectural pillars (Signals State, Clean Architecture, Figma/Jira MCP, and Enterprise Security) alongside technology badges.
  - **Accessibility & Tokens**: Full ARIA landmark structure (`role="banner"`, `role="main"`, `role="contentinfo"`), `:focus-visible` styling, high-contrast support (`@media (forced-colors: active)`), and `ChangeDetectionStrategy.OnPush`.
  - **Routing Configuration**: Configured root route (`path: ''`) to lazy-load `LandingPageComponent`, preserving protected `/boards` routes and redirection.
  - **Test Suite & Verification**: Added 7 unit tests covering unauthenticated vs. authenticated states, landmark accessibility, and feature rendering. Total suite: **125 / 125 tests passed** (86.06% Line Coverage, 83.47% Statement Coverage). Production build succeeded in 3.4s.

## [2026-11-01] — [FE] TaskPulse Full-Featured Responsive Frontend, Auth & Mobile Drawer (Jira: TAS-1)

- **Files / Systems Touched**: `task-pulse-ui/` (Angular standalone workspace, `src/styles/`, `src/environments/`, `src/app/core/`, `src/app/shared/`, `src/app/features/auth/`, `src/app/features/task-board/`)
- **AI Tool Used**: Antigravity (Gemini 3.8 Flash)
- **Reviewed By**: Darsh Aswani
- **Jira Issue**: [TAS-1](https://tatvasoft-team-go2icsxo.atlassian.net/browse/TAS-1) — `[FE] Implement TaskPulse Responsive Kanban Board & Layout from Figma`
- **Notes**: 
  - **Workspace & SCSS Tokens**: Configured standalone Angular workspace with SCSS design tokens (`_variables.scss`, `_tokens.scss`, `_mixins.scss`, `_reset.scss`), `environment.apiUrl` pointing to `.NET 8 Web API` at `http://localhost:5171`.
  - **Core Layer**: Implemented `apiUrlInterceptor`, `jwtInterceptor` (Bearer injection), `errorInterceptor` (RFC 7807 problem details parsing, single-flight token rotation via `TokenRefreshCoordinator`, queued retry), `AuthService`, `AuthStateService`, `authGuard` (`CanActivateFn`), and `NotificationService` driven by Angular Signals.
  - **Auth Feature Pages**: Built `LoginComponent` and `RegisterComponent` with strictly-typed reactive forms (`fb.nonNullable.group`), inline field error messages, password match cross-field validator, error banners, and loading indicators.
  - **Shared UI Atoms**: Built reusable standalone components with `ChangeDetectionStrategy.OnPush`: `BadgeComponent` (priority pills & custom hex tags), `AvatarComponent` (deterministic fallback palette), `ConfirmModalComponent` (accessible modal dialog), `LoadingSpinnerComponent`, and `EmptyStateComponent`.
  - **Responsive Layout & Accessibility**: Built `BoardLayoutComponent` featuring desktop (1440px) sticky sidebar navigation and mobile (390px) collapsible drawer navigation with backdrop, touch target sizing ($\ge 44\text{px}$), Escape key dismissal listener, `:focus-visible` outlines, high-contrast support (`forced-colors`), and `prefers-reduced-motion` compliance.
  - **Board Feature & Touch Snapping**: Built `BoardHeaderComponent` (live search, priority & assignee filters, active user profile badge, logout trigger), `BoardColumnComponent` (column headers, WIP limits, drop list container, responsive mobile column snapping), `TaskCardComponent` (priority badges, labels, due date, assignee avatar), and `TaskDialogComponent` (strictly-typed reactive form modal for create/edit).
  - **Reactive State & Optimistic UI**: Implemented `TaskStateService` managing `board`, `users`, `searchTerm`, `priorityFilter`, `assigneeFilter`, `filteredColumns`, and optimistic actions with automatic rollback on error: `createTaskOptimistically`, `updateTaskOptimistically`, `deleteTaskOptimistically`, `assignUserOptimistically`, and `moveTaskOptimistically`.
  - **Drag-and-Drop**: Integrated `@angular/cdk/drag-drop` across columns with drop list grouping, animated previews, dashed drop placeholders, and position rebalancing.
  - **Test Suite & Production Build**: 118/118 unit tests passed across all components, interceptors, and services (85.95% Line Coverage, 83.33% Statement Coverage exceeding TVS $\ge 80\%$ standard). Clean production build with **0 budget warnings and 0 errors**.
  - **Live Backend Integration**: Verified communication between frontend and live .NET 8 Web API at `http://localhost:5171`, including registration, authentication, board queries, task creation, user assignment, and move operations.


## [2026-11-01] — User Management Services, DTOs & UsersController

- **Files / Systems Touched**: `src/TaskPulse.Domain/Interfaces/IUserRepository.cs`, `src/TaskPulse.Infrastructure/Repositories/UserRepository.cs`, `src/TaskPulse.Application/DTOs/UserDtos.cs`, `src/TaskPulse.Application/Interfaces/IUserService.cs`, `src/TaskPulse.Application/Services/UserService.cs`, `src/TaskPulse.Application/Extensions/ApplicationServiceExtensions.cs`, `src/TaskPulse.API/Controllers/UsersController.cs`, `tests/TaskPulse.Application.Tests/Services/UserServiceTests.cs`, `tests/TaskPulse.API.Tests/Controllers/UsersControllerTests.cs`
- **AI Tool Used**: Antigravity (Gemini 3.8 Flash)
- **Reviewed By**: Darsh Aswani
- **Notes**: 
  - Added `UserDto` (`Id`, `FullName`, `Email`, `AvatarUrl`) and `AssignUserDto` (`Guid? UserId`).
  - Updated `IUserRepository` and `UserRepository` to add `GetAllAsync`.
  - Implemented `IUserService` and `UserService` with `GetAllAsync` and `AssignTaskUserAsync` handling user listing, assignment, unassignment, and `NotFoundException` guards.
  - Implemented thin `UsersController` with `[Authorize]` exposing `GET /api/v1/users` and `PATCH /api/v1/tasks/{taskId}/assign` wrapped in standard `ApiResponse<T>` envelopes.
  - Added unit test suites `UserServiceTests` and `UsersControllerTests`.
  - Test results: 98 passed out of 98 across the entire solution (69 Application, 25 API, 4 Infrastructure), 0 errors, 0 warnings.


## [2026-11-01] — AuthController, JWT Middleware, Swagger Bearer Auth & Live API Verification

- **Files / Systems Touched**: `src/TaskPulse.API/Controllers/AuthController.cs`, `src/TaskPulse.API/Controllers/BoardsController.cs`, `src/TaskPulse.API/Controllers/ColumnsController.cs`, `src/TaskPulse.API/Controllers/TasksController.cs`, `src/TaskPulse.API/Program.cs`, `src/TaskPulse.API/Middleware/ExceptionHandlingMiddleware.cs`, `tests/TaskPulse.API.Tests/`
- **AI Tool Used**: Antigravity (Gemini 3.8 Flash)
- **Reviewed By**: Darsh Aswani
- **Notes**: 
  - Implemented `AuthController` exposing `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, and `POST /api/v1/auth/refresh`.
  - Configured `AddJwtBearer` authentication and authorization middleware in `Program.cs`.
  - Protected `BoardsController`, `ColumnsController`, and `TasksController` with `[Authorize]`.
  - Updated `ExceptionHandlingMiddleware` to map `UnauthorizedAccessException` to HTTP 401 Unauthorized in `ApiResponse<object>` format.
  - Configured Swagger/OpenAPI with Bearer token security definition and security requirement.
  - Added unit tests in `TaskPulse.API.Tests` for `AuthController` and 401 unauthorized handling.
  - Test results: 90 passed out of 90 across entire solution (64 Application, 22 API, 4 Infrastructure).
  - Launched API at `http://localhost:5171` and verified live end-to-end: unauthenticated access blocking (401), registration, JWT Bearer authenticated access, and token rotation.

## [2026-11-01] — Authentication Services, JWT/RefreshToken Rotation & Security Tests

- **Files / Systems Touched**: `src/TaskPulse.Application/`, `src/TaskPulse.Domain/Interfaces/IUserRepository.cs`, `src/TaskPulse.Infrastructure/Repositories/UserRepository.cs`, `src/TaskPulse.API/appsettings.json`, `src/TaskPulse.API/appsettings.Development.json`, `tests/TaskPulse.Application.Tests/`
- **AI Tool Used**: Antigravity (Gemini 3.8 Flash)
- **Reviewed By**: Darsh Aswani
- **Notes**: 
  - Implemented Auth DTOs: `RegisterDto`, `LoginDto`, `TokenResponseDto`, `RefreshTokenRequestDto`.
  - Implemented `IPasswordHasher` & `PasswordHasher` using `HMACSHA512` and constant-time `CryptographicOperations.FixedTimeEquals` against timing attacks.
  - Implemented `ITokenService` & `TokenService` generating 15-min JWT access tokens and cryptographically random 7-day refresh tokens.
  - Implemented `IAuthService` & `AuthService` with `RegisterAsync`, `LoginAsync`, and `RefreshTokenAsync` including single-use token rotation and reuse detection (compromised token attempts immediately revoke all user sessions).
  - Implemented FluentValidation rules for `RegisterDto` (length, complexity) and `LoginDto`.
  - Configured `Jwt` settings in `appsettings.json` and `appsettings.Development.json` (no hardcoded secrets).
  - Implemented unit test suites (`PasswordHasherTests`, `TokenServiceTests`, `AuthServiceTests`, `AuthValidatorTests`).
  - Test results: 64 passed in Application.Tests (86 passed across entire solution), 89.65% Line Coverage on Application layer, 0 warnings, 0 errors.

## [2026-11-01] — Authentication Schema & RefreshToken Migration (AddUserAuthAndRefreshTokens)

- **Files / Systems Touched**: `src/TaskPulse.Domain/Entities/User.cs`, `src/TaskPulse.Domain/Entities/RefreshToken.cs`, `src/TaskPulse.Infrastructure/Data/AppDbContext.cs`, `src/TaskPulse.Infrastructure/Data/Configurations/RefreshTokenConfiguration.cs`, `src/TaskPulse.Infrastructure/Data/Configurations/UserConfiguration.cs`, Local SQL Server (`TaskPulse`)
- **AI Tool Used**: Antigravity (Gemini 3.8 Flash)
- **Reviewed By**: Darsh Aswani
- **Notes**: 
  - Updated `User` entity with `PasswordHash` (`varbinary(max)`), `PasswordSalt` (`varbinary(max)`), and `RefreshTokens` 1:N navigation.
  - Implemented `RefreshToken` entity inheriting `BaseEntity` with `Token`, `ExpiresAt`, `RevokedAt`, `UserId`, `IsExpired`, and `IsActive`.
  - Implemented `RefreshTokenConfiguration` with unique index on `Token`, index on `UserId`, soft-delete filter, and cascade deletion.
  - Registered `DbSet<RefreshToken>` in `AppDbContext`.
  - Generated and applied EF Core migration `AddUserAuthAndRefreshTokens` to local SQL Server database `TaskPulse` after explicit human approval.

## [2026-11-01] — Thin REST API Controllers, Middleware & Integration Tests (Chunk 4)

- **Files / Systems Touched**: `src/TaskPulse.API/`, `tests/TaskPulse.API.Tests/`
- **AI Tool Used**: Antigravity (Gemini 3.8 Flash)
- **Reviewed By**: Darsh Aswani
- **Notes**: 
  - Implemented standardized `ApiResponse<T>` contract envelope for all endpoints.
  - Implemented `ExceptionHandlingMiddleware` mapping domain exceptions (`ValidationException` -> 400 with errors, `NotFoundException` -> 404, `WipLimitExceededException` -> 400, unhandled -> 500) to RFC 7807/ApiResponse envelopes.
  - Implemented thin controllers: `BoardsController`, `TasksController`, and `ColumnsController` without business logic leakage.
  - Configured Swagger/OpenAPI documentation and CORS policy for Angular frontend (`http://localhost:4200`).
  - Implemented 18 unit and integration tests across controllers and middleware using `xUnit`, `Moq`, and `FluentAssertions`.
  - Test results: 18 passed in API.Tests (52 passed across entire solution), 0 warnings, 0 errors.

## [2026-11-01] — Application Services, DTOs, FluentValidation & Unit Tests (Chunk 3)

- **Files / Systems Touched**: `src/TaskPulse.Application/`, `tests/TaskPulse.Application.Tests/`
- **AI Tool Used**: Antigravity (Gemini 3.8 Flash)
- **Reviewed By**: Darsh Aswani
- **Notes**: 
  - Implemented application DTOs: `BoardSummaryDto`, `BoardDetailDto`, `CreateBoardDto`, `ColumnDto`, `CreateColumnDto`, `UpdateColumnDto`, `TaskItemDto`, `CreateTaskDto`, `UpdateTaskDto`, `MoveTaskDto`, `LabelDto`.
  - Implemented custom exceptions: `NotFoundException`, `WipLimitExceededException`.
  - Implemented FluentValidation rules: `CreateBoardDtoValidator`, `CreateColumnDtoValidator`, `CreateTaskDtoValidator`, `UpdateTaskDtoValidator`, `MoveTaskDtoValidator`.
  - Implemented `BoardService` with default 3 Kanban columns creation ("To Do", "In Progress", "Done").
  - Implemented `TaskService` with transactional task positioning, contiguous index rebalancing for same-column reordering, cross-column moving, WIP limit enforcement, and soft-delete rebalancing.
  - Implemented `AddApplicationServices()` DI extension method.
  - Created 34 unit tests with `xUnit`, `Moq`, and `FluentAssertions` covering services, validators, and DI extensions.
  - Test results: 34 passed, 0 failed, 86.94% Line Coverage, 86.36% Branch Coverage (exceeding ≥80% requirement).

## [2026-11-01] — Clean Architecture Solution, Infrastructure & Initial EF Core Migration

- **Files / Systems Touched**: `TaskPulse.sln`, `src/TaskPulse.Domain/`, `src/TaskPulse.Infrastructure/`, `src/TaskPulse.API/`, `tests/`, Local SQL Server (`TaskPulse`)
- **AI Tool Used**: Antigravity (Gemini 3.8 Flash)
- **Reviewed By**: Darsh Aswani
- **Notes**: 
  - Initialized .NET 8 solution with 4 Clean Architecture layers and 3 test projects.
  - Implemented Domain entities (`Board`, `Column`, `TaskItem`, `Label`, `TaskLabel`, `User`), `TaskPriority` enum, `BaseEntity` with audit & soft-delete fields, and repository interfaces.
  - Implemented `AppDbContext` with automatic audit interceptor (`CreatedAt`, `UpdatedAt`, `Id` generation) and Fluent API configurations for all entities.
  - Configured composite indexes on `(BoardId, Position)` and `(ColumnId, Position)`.
  - Configured soft-delete global query filters on all domain entities.
  - Registered infrastructure services via `AddInfrastructureServices()` in DI.
  - Executed migration `InitialKanbanSchema` and successfully updated local SQL Server database `TaskPulse` creating 6 schema tables.

## [2026-11-01] — Backend Foundation Task Created (TAS-2)

- **Files / Systems Touched**: Jira (`TAS-2`)
- **AI Tool Used**: Antigravity (Gemini 3.8 Flash)
- **Reviewed By**: Darsh Aswani
- **Notes**: 
  - Created backend architecture & implementation task `TAS-2`: `[BE] Architecture Analysis, Domain Schema & Core REST API Implementation`.
  - Defined 4-layer Clean Architecture structure (`API`, `Application`, `Infrastructure`, `Domain`) and dedicated test layer (`Application.Tests`, `API.Tests`, `Infrastructure.Tests`).
  - Added acceptance criteria for EF Core Code-First Fluent API modeling, soft deletes, validation, and xUnit testing with ≥80% coverage.

## [2026-10-31] — MCP Verification & Demo Task Creation (TAS-1)

- **Files / Systems Touched**: `.agents/mcp_config.json`, Jira (`TAS`), Figma (`WewMXf559OLV10du8qZpzg`)
- **AI Tool Used**: Antigravity (Gemini 3.8 Flash)
- **Reviewed By**: Darsh Aswani
- **Notes**: 
  - Verified Figma connection: inspected screens (`Board Desktop 1440`, `Board Mobile 390`) and components (`Task Card`, `Button`, `Tag`, `Avatar`).
  - Verified Jira connection: queried project `TAS` (`TaskPulse1`).
  - Created initial development task `TAS-1`: `[FE] Implement TaskPulse Responsive Kanban Board & Layout from Figma` with acceptance criteria and design references.

## [2026-10-30] — Project Setup: AI Development Guidelines Configuration

- **Files Changed**: AGENTS.md, .agents/ (skills, agents, rules, MCP config)
- **AI Tool Used**: Antigravity (Claude Opus 4.6)
- **Reviewed By**: [Developer Name]
- **Notes**: Initial AI-ready project configuration including:
  - Project instruction file (AGENTS.md) with full architecture docs
  - 8 skills (dotnet-backend, angular-frontend, database-management, git-operations, testing, code-review, jira-workflow, figma-to-code)
  - 4 specialized agents (backend-developer, frontend-developer, code-reviewer, test-engineer)
  - MCP configuration for Jira, Figma, and Git
  - Strict Git and Database confirmation rules
