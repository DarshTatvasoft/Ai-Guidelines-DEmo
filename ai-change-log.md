# AI Change Log

> Record of notable AI-assisted changes to the codebase.
> Required by TVS-DEV-AI-GL-01.3 Mandatory AI Usage Guidelines.

---

<!-- Add entries in reverse chronological order -->

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

