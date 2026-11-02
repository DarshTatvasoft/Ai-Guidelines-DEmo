import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { User } from '../../models';

/**
 * BoardLayoutComponent — Full responsive shell layout implementing the Figma desktop
 * (1440px) sidebar navigation and mobile (390px) collapsible drawer.
 */
@Component({
  selector: 'app-board-layout',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <div class="layout-container">
      <!-- Mobile Backdrop -->
      @if (mobileMenuOpen()) {
        <div
          class="sidebar-backdrop"
          aria-hidden="true"
          (click)="mobileMenuOpen.set(false)"
        ></div>
      }

      <!-- Sidebar Shell -->
      <aside
        class="layout-sidebar"
        [class.layout-sidebar--open]="mobileMenuOpen()"
        [attr.aria-expanded]="mobileMenuOpen()"
        aria-label="Main Navigation"
      >
        <!-- Logo Branding -->
        <div class="sidebar-brand">
          <div class="brand-logo" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span class="brand-name">TaskPulse</span>

          <!-- Mobile Close Button -->
          <button
            type="button"
            class="mobile-close-btn"
            aria-label="Close menu"
            (click)="mobileMenuOpen.set(false)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Main Navigation Links -->
        <nav class="sidebar-nav">
          <div class="nav-section-title">Menu</div>
          <ul class="nav-list">
            <li>
              <a href="javascript:void(0)" class="nav-link nav-link--active">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
                <span>Boards</span>
              </a>
            </li>
            <li>
              <a href="javascript:void(0)" class="nav-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
                <span>Analytics</span>
              </a>
            </li>
            <li>
              <a href="javascript:void(0)" class="nav-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Settings</span>
              </a>
            </li>
          </ul>

          <!-- Projects Section -->
          <div class="nav-section-title">Projects</div>
          <ul class="nav-list">
            <li>
              <a href="javascript:void(0)" class="nav-link nav-link--sub">
                <span class="project-dot project-dot--indigo"></span>
                <span>TaskPulse MVP</span>
              </a>
            </li>
            <li>
              <a href="javascript:void(0)" class="nav-link nav-link--sub">
                <span class="project-dot project-dot--emerald"></span>
                <span>Feedback Portal</span>
              </a>
            </li>
          </ul>
        </nav>

        <!-- User Profile Footer -->
        <div class="sidebar-user">
          <div class="user-info">
            <app-avatar
              [name]="user()?.fullName || 'User'"
              [size]="'sm'"
              [src]="user()?.avatarUrl ?? null"
            />
            <div class="user-details">
              <span class="user-name">{{ user()?.fullName || 'TaskPulse User' }}</span>
              <span class="user-email">{{ user()?.email || 'user@taskpulse.com' }}</span>
            </div>
          </div>

          <button
            type="button"
            class="logout-btn"
            aria-label="Log out"
            title="Log out"
            (click)="logout.emit()"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </aside>

      <!-- Main Shell Area -->
      <div class="layout-main">
        <!-- Mobile Top App Bar (Hamburger) -->
        <div class="mobile-top-bar">
          <button
            type="button"
            class="hamburger-btn"
            [attr.aria-expanded]="mobileMenuOpen()"
            aria-label="Open navigation menu"
            (click)="mobileMenuOpen.set(true)"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div class="mobile-brand">TaskPulse</div>
        </div>

        <!-- Projected Header Slot -->
        <ng-content select="[header]" />

        <!-- Projected Main Board Workspace -->
        <main class="layout-content">
          <ng-content />
        </main>
      </div>
    </div>
  `,
  styleUrl: './board-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardLayoutComponent {
  readonly user = input<User | null>(null);
  readonly logout = output<void>();

  protected readonly mobileMenuOpen = signal<boolean>(false);

  @HostListener('keydown.escape')
  protected onEscape(): void {
    if (this.mobileMenuOpen()) {
      this.mobileMenuOpen.set(false);
    }
  }
}

