import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, NotificationService } from '../../../../core/services';

/**
 * LoginComponent — Authenticates user credentials with strictly-typed reactive form.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <!-- Logo & Header -->
        <header class="auth-header">
          <div class="auth-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <h1 class="auth-title">Welcome back</h1>
          <p class="auth-subtitle">Sign in to your TaskPulse workspace</p>
        </header>

        <!-- Error Alert -->
        @if (errorMessage()) {
          <div class="alert alert--danger" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <!-- Login Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form" novalidate>
          <!-- Email Field -->
          <div class="form-group">
            <label for="login-email" class="form-label">Email address</label>
            <input
              id="login-email"
              type="email"
              class="form-control"
              [class.form-control--error]="emailInvalid()"
              formControlName="email"
              placeholder="name@company.com"
              autocomplete="email"
            />
            @if (emailInvalid()) {
              <span class="field-error">Please enter a valid email address.</span>
            }
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <div class="password-label-row">
              <label for="login-password" class="form-label">Password</label>
            </div>
            <input
              id="login-password"
              type="password"
              class="form-control"
              [class.form-control--error]="passwordInvalid()"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            @if (passwordInvalid()) {
              <span class="field-error">Password must be at least 6 characters.</span>
            }
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn btn--primary btn--full"
            [disabled]="form.invalid || isLoading()"
          >
            @if (isLoading()) {
              <span class="spinner-inline" aria-hidden="true"></span>
              <span>Signing in...</span>
            } @else {
              <span>Sign in</span>
            }
          </button>
        </form>

        <!-- Footer / Switch to Register -->
        <footer class="auth-footer">
          <p class="switch-prompt">
            Don't have an account?
            <a routerLink="/register" class="auth-link">Create account</a>
          </p>
        </footer>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isLoading = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected returnUrl = '/boards';

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    const queryReturnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (queryReturnUrl) {
      this.returnUrl = queryReturnUrl;
    }
  }

  protected emailInvalid(): boolean {
    const ctrl = this.form.controls.email;
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  protected passwordInvalid(): boolean {
    const ctrl = this.form.controls.password;
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService.login({ email: email.trim(), password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notificationService.success('Welcome back to TaskPulse!');
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.message || 'Invalid email or password. Please try again.'
        );
      },
    });
  }
}

