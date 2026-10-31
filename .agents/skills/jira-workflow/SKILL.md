---
name: jira-workflow
description: >-
  Skill for integrating with Jira via MCP for task management.
  Retrieve issue details, use tickets as development context, and update
  issues when permitted. Follows least-privilege MCP guidelines.
---

# Jira Workflow Skill

## Overview (per TVS-DEV-AI-GL-01.8)

Jira MCP allows the AI editor to retrieve project and issue information and,
depending on permissions, create or update Jira issues. This provides
**real project context** instead of guessing from stale information.

## MCP Security Rules

1. **Read-only by default** — Only retrieve issue information unless write is explicitly needed
2. **Confirm target** — Before any write operation, confirm the correct project, issue, and fields
3. **Review before update** — Show the intended changes and get approval before executing
4. **No credentials in code** — Jira API token stays in MCP config environment variables only
5. **Least privilege** — Disable destructive tools (delete_issue) if not required

## Typical Workflow

### 1. Retrieve Task Context
```
"Fetch Jira issue PROJ-123 and summarize the requirements, acceptance criteria,
and any linked issues."
```

### 2. Use as Development Context
```
"Based on the requirements in PROJ-123, implement the customer search API
following the existing project patterns."
```

### 3. Update Status (if permitted — requires confirmation)
```
⚠️ Before updating, confirm:
- Issue: PROJ-123
- Field: Status
- New value: "In Progress"
- Reason: Development started

Proceed? [Wait for approval]
```

### 4. Add Comment (if permitted — requires confirmation)
```
⚠️ Before commenting, confirm:
- Issue: PROJ-123
- Comment: "Backend API implementation complete. PR #45 created."

Proceed? [Wait for approval]
```

## Branch Naming from Jira

When creating a branch from a Jira issue:
- `feature/PROJ-123-short-description`
- `bugfix/PROJ-124-login-fix`
- `hotfix/PROJ-125-critical-patch`

## Commit Messages with Jira References

```
feat(customers): add search API endpoint

Implements customer search with email and name filters.

Refs: PROJ-123
```

## What NOT to Do

- ❌ Do NOT auto-update Jira without user confirmation
- ❌ Do NOT delete issues via MCP
- ❌ Do NOT paste Jira credentials in prompts
- ❌ Do NOT expose sensitive issue content in logs
- ❌ Do NOT assume issue details — always fetch fresh data

