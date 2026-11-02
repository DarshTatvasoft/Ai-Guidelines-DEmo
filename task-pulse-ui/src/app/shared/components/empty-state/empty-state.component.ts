import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * EmptyStateComponent — Clean placeholder displayed when no cards, boards, or data exist.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state" role="region" [attr.aria-label]="title()">
      <div class="empty-state__icon" aria-hidden="true">
        <ng-content select="[icon]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </ng-content>
      </div>

      <h3 class="empty-state__title">{{ title() }}</h3>

      @if (description()) {
        <p class="empty-state__desc">{{ description() }}</p>
      }

      <div class="empty-state__actions">
        <ng-content>
          @if (actionText()) {
            <button type="button" class="btn btn--primary" (click)="action.emit()">
              {{ actionText() }}
            </button>
          }
        </ng-content>
      </div>
    </div>
  `,
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input<string>('No items found');
  readonly description = input<string>('');
  readonly actionText = input<string>('');

  readonly action = output<void>();
}

