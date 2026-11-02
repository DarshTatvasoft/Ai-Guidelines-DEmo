import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant =
  | 'priority-low'
  | 'priority-medium'
  | 'priority-high'
  | 'priority-urgent'
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * BadgeComponent — Displays compact status pills, tags, and priority indicators.
 * Follows accessibility guidelines with high contrast and semantic attributes.
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="badge badge--{{ size() }} badge--{{ variant() }}"
      [class.badge--custom]="!!colorHex()"
      [style.background-color]="customBgColor()"
      [style.color]="customTextColor()"
      [style.border-color]="customBorderColor()"
      role="status"
    >
      @if (dot()) {
        <span class="badge__dot" aria-hidden="true"></span>
      }
      <ng-content />
    </span>
  `,
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  /** Visual variant of the badge (priority levels or semantic states) */
  readonly variant = input<BadgeVariant>('default');

  /** Size modifier */
  readonly size = input<BadgeSize>('md');

  /** Whether to display a status dot */
  readonly dot = input<boolean>(false);

  /** Optional hex code override for custom tag colors */
  readonly colorHex = input<string | null>(null);

  protected readonly customBgColor = computed(() => {
    const hex = this.colorHex();
    return hex ? `${hex}1A` : null; // 10% opacity for subtle background
  });

  protected readonly customTextColor = computed(() => {
    return this.colorHex() ?? null;
  });

  protected readonly customBorderColor = computed(() => {
    const hex = this.colorHex();
    return hex ? `${hex}40` : null; // 25% opacity for border
  });
}

