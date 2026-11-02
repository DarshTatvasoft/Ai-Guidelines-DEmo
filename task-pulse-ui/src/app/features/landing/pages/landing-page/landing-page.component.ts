import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../../../core/services';

/**
 * LandingPageComponent — Public welcome and marketing page introducing TaskPulse.
 * Highlights Kanban task management, Angular Signals, Clean Architecture, and provides CTAs.
 */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  private readonly authState = inject(AuthStateService);

  /** Whether a user session is currently active */
  readonly isAuthenticated = this.authState.isAuthenticated;
  readonly currentUser = this.authState.currentUser;

  readonly features = [
    {
      title: 'Angular Signals Reactive State',
      description:
        'Sub-millisecond state updates, fine-grained computed projections, and optimistic UI with instant rollback on network failures.',
      icon: 'bolt',
      tag: 'Frontend',
    },
    {
      title: '.NET 8 Clean Architecture',
      description:
        'Enterprise 4-layer architecture with strict domain boundaries, EF Core Code-First migrations, and RFC 7807 problem details.',
      icon: 'layers',
      tag: 'Backend',
    },
    {
      title: 'Figma & Jira MCP Integration',
      description:
        'Engineered for AI-assisted development using Model Context Protocol for design-token fidelity and issue context pulling.',
      icon: 'cpu',
      tag: 'Integration',
    },
    {
      title: 'Enterprise Security & Accessibility',
      description:
        'HMAC-SHA512 password hashing, rotating refresh tokens, ARIA landmarks, keyboard navigation, and high-contrast support.',
      icon: 'shield',
      tag: 'Security',
    },
  ];

  readonly techStack = [
    'Angular 22',
    'Signals & OnPush',
    '.NET 8 Web API',
    'EF Core 8',
    'SQL Server',
    'TypeScript 5.9',
    'CDK Drag & Drop',
    'SCSS Design Tokens',
  ];
}

