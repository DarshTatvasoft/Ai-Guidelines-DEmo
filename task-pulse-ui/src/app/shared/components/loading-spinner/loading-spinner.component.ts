import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerColor = 'primary' | 'white' | 'gray';

/**
 * LoadingSpinnerComponent — Accessible spinner indicator for asynchronous loading states.
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="spinner-container"
      [class.spinner-container--fullscreen]="fullscreen()"
      role="status"
      aria-live="polite"
    >
      <div class="spinner spinner--{{ size() }} spinner--{{ color() }}" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" class="spinner__svg">
          <circle
            class="spinner__track"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="3"
          />
          <path
            class="spinner__arc"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>

      <span class="sr-only">{{ message() || 'Loading, please wait...' }}</span>

      @if (message()) {
        <p class="spinner__label">{{ message() }}</p>
      }
    </div>
  `,
  styleUrl: './loading-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent {
  readonly size = input<SpinnerSize>('md');
  readonly color = input<SpinnerColor>('primary');
  readonly message = input<string>('');
  readonly fullscreen = input<boolean>(false);
}

