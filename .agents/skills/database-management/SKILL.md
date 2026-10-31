---
name: database-management
description: >-
  Skill for managing SQL Server database with EF Core Code-First approach.
  MANDATORY: This skill enforces strict confirmation before ANY database operation.
  Use this skill for entity creation, migrations, schema changes, and seed data.
---

# Database Management Skill — EF Core Code-First (SQL Server)

## ⚠️ CRITICAL SAFETY RULE

> **STOP. CONFIRM. THEN PROCEED.**
>
> You MUST get explicit user approval before performing ANY database-related action.
> This is non-negotiable and applies to every operation listed below.

### Mandatory Confirmation Checklist

Before ANY database operation, you MUST:

1. **📋 State EXACTLY what you intend to do**
   - Which entity/table is affected?
   - What properties/columns are being added, modified, or removed?
   - What relationships are being created or changed?

2. **⚡ Explain the IMPACT on existing data**
   - Will existing data be preserved?
   - Are there nullable/default value considerations?
   - Will any data need to be migrated?
   - Are there breaking changes to existing APIs?

3. **⚠️ List ALL RISKS**
   - Data loss potential
   - Breaking changes to other entities/relationships
   - Index/constraint impacts
   - Migration rollback considerations

4. **📝 Show the GENERATED SQL** (for migrations)
   - Run `dotnet ef migrations script` or show the expected SQL
   - Explain what each SQL statement does

5. **✅ Wait for explicit "yes", "proceed", or "approved"**
   - Do NOT assume approval
   - Do NOT proceed on ambiguous responses
   - If in doubt, ask again

### Operations Requiring Confirmation

| Operation | Risk Level | What to Show |
|-----------|-----------|--------------|
| Create new entity | 🟡 Medium | Entity class, configuration, relationships |
| Modify existing entity | 🔴 High | Before/after comparison, data impact |
| Add/modify relationship | 🔴 High | Cascade behavior, FK constraints |
| Add migration | 🟡 Medium | Migration name, expected SQL |
| Apply migration | 🔴 High | Full SQL script, target database |
| Remove migration | 🔴 High | What will be undone |
| Modify DbContext | 🟡 Medium | What's changing, why |
| Add/modify index | 🟡 Medium | Performance impact, uniqueness |
| Change column type | 🔴 High | Data conversion risks |
| Remove column/table | 🔴 Critical | Data loss confirmation |
| Seed data changes | 🟡 Medium | What data, idempotency |
| Raw SQL execution | 🔴 Critical | Exact SQL, target DB |

---

## Code-First Workflow

### Step 1: Create/Modify Domain Entity

```csharp
// ProjectName.Domain/Entities/Customer.cs
public class Customer : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
```

### Step 2: Create Entity Configuration

```csharp
// ProjectName.Infrastructure/Data/Configurations/CustomerConfiguration.cs
public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("Customers");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(c => c.Email)
            .IsUnique();

        // Soft delete filter
        builder.HasQueryFilter(c => !c.IsDeleted);

        // Relationships
        builder.HasMany(c => c.Orders)
            .WithOne(o => o.Customer)
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.Restrict); // NEVER cascade delete
    }
}
```

### Step 3: Register in DbContext

```csharp
// ProjectName.Infrastructure/Data/AppDbContext.cs
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Auto-set audit fields
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
```

### Step 4: Create Migration (⚠️ REQUIRES APPROVAL)

```bash
# STOP — Show user the expected changes first!
dotnet ef migrations add AddCustomerTable --project src/ProjectName.Infrastructure --startup-project src/ProjectName.API
```

### Step 5: Review Migration SQL (⚠️ REQUIRES APPROVAL)

```bash
# Show the generated SQL before applying
dotnet ef migrations script --project src/ProjectName.Infrastructure --startup-project src/ProjectName.API
```

### Step 6: Apply Migration (⚠️ REQUIRES APPROVAL)

```bash
# Only after user approves the SQL
dotnet ef database update --project src/ProjectName.Infrastructure --startup-project src/ProjectName.API
```

---

## Base Entity Pattern

```csharp
// ProjectName.Domain/Common/BaseEntity.cs
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
}
```

## Database Rules

- **Soft deletes ONLY** — Set `IsDeleted = true`, never `DELETE FROM`
- **Audit fields** — Every entity has `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`
- **Fluent API only** — No data annotations on entities
- **Explicit FK configuration** — Always specify cascade behavior
- **Default: `DeleteBehavior.Restrict`** — Never cascade delete unless explicitly required
- **Unique indexes** — For business-unique fields (email, code, etc.)
- **Query filters** — For soft deletes (`HasQueryFilter(e => !e.IsDeleted)`)
- **Connection strings** — NEVER hardcode. Use `appsettings.json` with placeholders
- **No raw SQL** unless absolutely necessary and approved

## ⚠️ REMEMBER

Every single database operation — from creating an entity to applying a migration — requires your explicit step-by-step description and user approval. No exceptions.

