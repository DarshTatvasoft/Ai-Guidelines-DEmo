---
name: figma-to-code
description: >-
  Skill for converting Figma designs to Angular code using the Figma MCP server.
  Use this skill when implementing UI from Figma designs, ensuring pixel-accurate
  implementation with proper Angular component structure.
---

# Figma to Code Skill

## Overview (per TVS-DEV-AI-GL-01.8)

Figma MCP makes design information available to the AI editor. The typical workflow
is to select or provide a Figma design and generate or update the corresponding
frontend code.

## MCP Security Rules

1. **Read-only access** — Only retrieve design information; no Figma modifications
2. **No credentials in code** — Figma access token stays in MCP config only
3. **Review generated code** — Always compare output with the Figma design
4. **Approved MCP server only** — Use only the configured, trusted Figma MCP server

## Typical Workflow

### Step 1: Inspect the Design
```
"Inspect the Figma design at [design URL/reference] and describe:
- Layout structure (grid, flexbox)
- Color palette and typography
- Component hierarchy
- Responsive breakpoints
- Interactive states (hover, active, disabled)
Do NOT generate code yet."
```

### Step 2: Plan Component Structure
```
"Based on the Figma design, plan the Angular component structure:
- Which components to create (standalone)
- Which should be in shared/ vs feature-specific
- Props/inputs for reusable components
- State management approach (Signals)
Do NOT implement yet — show me the plan."
```

### Step 3: Implement Components
```
"Implement the [component name] from the Figma design following:
- Angular 22 standalone components
- OnPush change detection
- Signals for state management
- Typed reactive forms (if applicable)
- SCSS with component-scoped styles
- Responsive design (mobile-first)
- Accessibility (ARIA labels, semantic HTML)"
```

### Step 4: Review and Compare
```
"Compare the implemented component with the original Figma design:
- Layout accuracy
- Color/typography match
- Spacing and alignment
- Responsive behavior
- Interactive states"
```

## Angular Component Template from Figma

```typescript
@Component({
  selector: 'app-feature-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feature-component.component.html',
  styleUrl: './feature-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureComponent {
  // Use Signals for reactive state
  readonly data = signal<DataType[]>([]);
  readonly isLoading = signal(false);
}
```

## Design System Mapping

| Figma Token | Angular Implementation |
|-------------|----------------------|
| Colors | SCSS variables / CSS custom properties |
| Typography | SCSS mixins / global typography styles |
| Spacing | SCSS spacing scale variables |
| Shadows | SCSS shadow mixins |
| Border Radius | SCSS border-radius variables |
| Breakpoints | SCSS media query mixins |
| Icons | SVG icons or icon library |

## Checklist Before Submitting

- [ ] Component matches Figma design visually
- [ ] Responsive across breakpoints (mobile, tablet, desktop)
- [ ] Interactive states implemented (hover, focus, active, disabled)
- [ ] Accessibility: keyboard navigation, ARIA labels, semantic HTML
- [ ] Component test file created (`.spec.ts`)
- [ ] No hardcoded values — use design tokens/variables
- [ ] OnPush change detection enabled
- [ ] Standalone component (no NgModule)

