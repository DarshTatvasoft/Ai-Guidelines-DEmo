---
name: git-operations
description: >-
  Skill for Git version control operations with MANDATORY confirmation before every action.
  CRITICAL: No Git command may be executed without explicit user approval.
  Use this skill for all commits, pushes, merges, branching, and other Git operations.
---

# Git Operations Skill — Mandatory Confirmation Required

## ⚠️ CRITICAL SAFETY RULE

> **ABSOLUTE RULE: NEVER execute ANY Git command without explicit user approval.**
>
> This is the single most important rule in this skill. Violation risks data loss,
> force-pushed code, or overwritten teammate commits.

---

## Mandatory Confirmation Protocol

### Before EVERY Git operation, you MUST:

1. **📋 State the EXACT command** you will run
   ```
   Example: git commit -m "feat: add customer entity and repository"
   ```

2. **📖 Explain what it does** in plain English
   ```
   Example: "This will create a new commit on the current branch (feature/customers)
   containing the 3 staged files: Customer.cs, ICustomerRepository.cs, CustomerRepository.cs"
   ```

3. **⚠️ List any risks**
   ```
   Example: "No risks — this is a local commit only. Nothing is pushed to remote."
   ```

4. **✅ Wait for "yes", "proceed", "go ahead", or similar explicit approval**
   - Do NOT proceed on silence
   - Do NOT proceed on ambiguous responses like "okay" without confirmation
   - If unsure, ask: "Should I proceed with this Git command?"

---

## Risk Classification

### 🟢 Low Risk (Still requires confirmation)
- `git status` — Show current state
- `git log` — View history
- `git diff` — View changes
- `git branch` — List branches
- `git stash list` — View stashes

### 🟡 Medium Risk (Requires confirmation + explanation)
- `git add` — What files? Why these files?
- `git commit` — What message? What's included?
- `git checkout` / `git switch` — Uncommitted changes?
- `git stash` — What's being stashed? Will anything be lost?
- `git branch <name>` — From which base branch?
- `git pull` — Any local changes that might conflict?
- `git tag` — What version? Annotated?

### 🔴 High Risk (Requires confirmation + detailed justification)
- `git push` — Which branch? Which remote? First push?
- `git merge` — Which branches? Expected conflicts?
- `git rebase` — Which commits? Why rebase over merge?
- `git cherry-pick` — Which commit? From where?
- `git branch -d` — Is the branch merged?

### 🔴🔴 Critical Risk (Requires TRIPLE confirmation)
- `git push --force` / `git push --force-with-lease` — WHY? Impact on team?
- `git reset --hard` — What will be PERMANENTLY lost?
- `git clean -fd` — What untracked files will be DELETED?
- `git branch -D` — Unmerged work will be LOST
- `git rebase -i` on shared branches — Team impact?
- Any `--force` or `--hard` flag operation

---

## Branching Strategy

Follow a standard Git Flow or Trunk-Based approach:

```
main (production)
  └── develop (integration)
       ├── feature/JIRA-123-customer-crud
       ├── feature/JIRA-124-order-module
       ├── bugfix/JIRA-125-login-fix
       └── hotfix/JIRA-126-critical-patch
```

### Branch Naming Convention
- `feature/JIRA-XXX-short-description`
- `bugfix/JIRA-XXX-short-description`
- `hotfix/JIRA-XXX-short-description`
- `release/vX.Y.Z`

---

## Commit Message Convention

Use **Conventional Commits**:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types
| Type | Use For |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (no logic change) |
| `refactor` | Refactoring (no feature/fix) |
| `test` | Adding/updating tests |
| `chore` | Build, CI, tooling changes |
| `perf` | Performance improvement |

### Examples
```
feat(customers): add customer CRUD API endpoints
fix(auth): resolve token refresh 401 error
test(orders): add unit tests for order service
docs(readme): update setup instructions
```

---

## Common Workflows

### Starting a New Feature
```bash
# 1. Ensure you're on develop and up to date
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/JIRA-XXX-description

# 3. Work... commit in small logical units
git add <specific-files>
git commit -m "feat(scope): description"

# 4. Push feature branch
git push -u origin feature/JIRA-XXX-description

# 5. Create Pull Request for review
```

### Before Every Commit — Checklist
- [ ] All tests pass (`dotnet test` / `ng test`)
- [ ] Code builds without errors
- [ ] No debugging artifacts (console.log, breakpoints)
- [ ] No secrets or PII in committed files
- [ ] Only relevant files are staged
- [ ] Commit message follows convention

---

## Files to NEVER Commit

Ensure `.gitignore` includes:
```
# Secrets
appsettings.Development.json
*.pfx
*.key

# User-specific
.vs/
.vscode/
*.user
*.suo

# Build
bin/
obj/
dist/
node_modules/

# OS
.DS_Store
Thumbs.db
```

## ⚠️ REMEMBER

Every Git command — from `git add` to `git push` — requires your explicit description and user approval. No shortcuts. No assumptions. Ask first, act second.

