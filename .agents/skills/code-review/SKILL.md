---
name: code-review
description: >-
  Skill for performing code review on AI-generated and human-written code.
  Reviews for correctness, security, performance, conventions, and test coverage.
  Use this skill when reviewing code changes before commit or merge.
---

# Code Review Skill

## Review Protocol (per TVS-DEV-AI-GL-01)

> **All AI-generated or AI-assisted output must undergo human review and verification
> before it is committed, merged, deployed or released.**

### Review Mode
- This is a **read-only** review — do NOT modify any files
- Use a **separate agent or fresh context** for independent review (recommended for normal/complex changes)
- Return findings grouped as: **Critical / Warning / Suggestion**

---

## Review Checklist

### ☐ Functional Correctness
- [ ] Code implements the requirement correctly
- [ ] Edge cases are handled (null, empty, boundary values)
- [ ] Error handling is comprehensive
- [ ] No logical errors or off-by-one mistakes
- [ ] Async/await used correctly (no fire-and-forget)

### ☐ Architecture & Conventions
- [ ] Follows 4-layer architecture (API → Application → Infrastructure → Domain)
- [ ] No business logic in controllers
- [ ] Services code to interfaces
- [ ] DTOs separate from domain entities
- [ ] Dependency injection used correctly
- [ ] Naming conventions followed (PascalCase, _camelCase, Async suffix)

### ☐ Security
- [ ] No hardcoded secrets, API keys, or connection strings
- [ ] No PII logged or exposed
- [ ] Input validation present (FluentValidation)
- [ ] SQL injection prevention (parameterized queries / EF Core)
- [ ] Authorization checks where required
- [ ] CORS configured correctly

### ☐ Performance
- [ ] No N+1 query issues
- [ ] Proper use of `AsNoTracking()` for read-only queries
- [ ] Pagination for list endpoints
- [ ] Indexes for frequently queried columns
- [ ] No unnecessary loading of related data

### ☐ Data Protection
- [ ] No credentials in code or config (use user secrets / env vars)
- [ ] Sensitive data not logged
- [ ] Soft deletes used (not hard deletes)
- [ ] Audit fields populated

### ☐ Test Coverage
- [ ] Unit tests exist for new business logic
- [ ] Edge cases tested
- [ ] Error scenarios tested
- [ ] Tests follow AAA pattern
- [ ] Tests are independent (no shared state)
- [ ] Frontend components have spec files

### ☐ Unintended Changes
- [ ] Only intended files were modified
- [ ] No unrelated refactoring
- [ ] No dependency additions without justification
- [ ] Existing behavior preserved
- [ ] No formatting-only changes mixed with logic changes

---

## Output Format

```markdown
## Code Review Findings

### 🔴 Critical (Must Fix)
1. [File:Line] — Description of critical issue
   - **Risk**: What could go wrong
   - **Fix**: Recommended solution

### 🟡 Warning (Should Fix)
1. [File:Line] — Description of warning
   - **Risk**: Potential impact
   - **Fix**: Recommended solution

### 🟢 Suggestion (Nice to Have)
1. [File:Line] — Description of suggestion
   - **Benefit**: Why this improves the code

### ✅ What Looks Good
- List of things done well

### 📊 Summary
- Files reviewed: X
- Issues found: X Critical, X Warning, X Suggestion
- Test coverage: Adequate / Needs improvement
- Ready to merge: Yes / No (with reasons)
```

