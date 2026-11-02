import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ConfirmModalComponent — Accessible modal dialog for confirmations, destructive deletions, and prompts.
 * Adheres to WAI-ARIA Dialog (Modal) pattern with keyboard navigation (ESC) and backdrop dismiss.
 */
@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div
        class="modal-backdrop"
        (click)="onBackdropClick($event)"
        tabindex="-1"
      >
        <div
          class="modal-dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="modalId + '-title'"
          [attr.aria-describedby]="modalId + '-desc'"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-dialog__header">
            <h2 [id]="modalId + '-title'" class="modal-dialog__title">
              {{ title() }}
            </h2>
            <button
              type="button"
              class="modal-dialog__close"
              aria-label="Close dialog"
              [disabled]="isLoading()"
              (click)="onCancel()"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="modal-dialog__body">
            <p [id]="modalId + '-desc'" class="modal-dialog__message">
              {{ message() }}
            </p>
            <ng-content />
          </div>

          <div class="modal-dialog__footer">
            <button
              type="button"
              class="btn btn--secondary"
              [disabled]="isLoading()"
              (click)="onCancel()"
            >
              {{ cancelText() }}
            </button>
            <button
              type="button"
              class="btn"
              [class.btn--danger]="confirmVariant() === 'danger'"
              [class.btn--primary]="confirmVariant() === 'primary'"
              [disabled]="isLoading()"
              (click)="onConfirm()"
            >
              @if (isLoading()) {
                <span class="spinner-inline" aria-hidden="true"></span>
              }
              {{ confirmText() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './confirm-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('Confirm Action');
  readonly message = input<string>('Are you sure you want to proceed?');
  readonly confirmText = input<string>('Confirm');
  readonly cancelText = input<string>('Cancel');
  readonly confirmVariant = input<'primary' | 'danger'>('primary');
  readonly isLoading = input<boolean>(false);

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  protected readonly modalId = 'modal-' + Math.random().toString(36).substring(2, 9);

  @HostListener('document:keydown.escape', ['$event'])
  protected handleEscape(event?: Event): void {
    if (this.isOpen() && !this.isLoading()) {
      event?.preventDefault();
      this.onCancel();
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (!this.isLoading()) {
      this.onCancel();
    }
  }

  protected onConfirm(): void {
    if (!this.isLoading()) {
      this.confirm.emit();
    }
  }

  protected onCancel(): void {
    if (!this.isLoading()) {
      this.cancel.emit();
    }
  }
}
