import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * AvatarComponent — Displays user avatar images with fallback to deterministic initials and background colors.
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="avatar avatar--{{ size() }}"
      [style.background-color]="hasValidImage() ? 'transparent' : bgColor()"
      [attr.role]="'img'"
      [attr.aria-label]="ariaLabel()"
    >
      @if (hasValidImage()) {
        <img
          class="avatar__img"
          [src]="src()!"
          [alt]="alt() || name() || 'User avatar'"
          (error)="onImageError()"
        />
      } @else {
        <span class="avatar__initials">{{ initials() }}</span>
      }
    </div>
  `,
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  /** Image URL */
  readonly src = input<string | null>(null);

  /** User full name (used for initials and deterministic colors) */
  readonly name = input<string>('');

  /** Size preset */
  readonly size = input<AvatarSize>('md');

  /** Custom accessible alt text */
  readonly alt = input<string>('');

  protected readonly imageError = signal<boolean>(false);

  protected readonly hasValidImage = computed(() => {
    return !!this.src() && !this.imageError();
  });

  protected readonly ariaLabel = computed(() => {
    return this.alt() || this.name() || 'User avatar';
  });

  protected readonly initials = computed(() => {
    const rawName = this.name().trim();
    if (!rawName) return '?';

    const parts = rawName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  protected readonly bgColor = computed(() => {
    const rawName = this.name().trim();
    if (!rawName) return 'var(--color-gray-400)';

    // Deterministic palette mapping
    const palette = [
      '#6366F1', // Indigo
      '#059669', // Emerald
      '#D97706', // Amber
      '#DC2626', // Red
      '#2563EB', // Blue
      '#7C3AED', // Violet
      '#0891B2', // Cyan
      '#DB2777', // Pink
    ];

    let hash = 0;
    for (let i = 0; i < rawName.length; i++) {
      hash = rawName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palette.length;
    return palette[index];
  });

  protected onImageError(): void {
    this.imageError.set(true);
  }
}

