import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, NotificationService } from '../../../../core/services';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

/**
 * RegisterComponent — New user onboarding with strictly-typed reactive form and validation.
 */
@Component({
  selector: 'app-register',
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
          <h1 class="auth-title">Create an account</h1>
          <p class="auth-subtitle">Get started with your free TaskPulse board</p>
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

        <!-- Registration Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form" novalidate>
          <!-- Full Name Field -->
          <div class="form-group">
            <label for="reg-name" class="form-label">Full Name</label>
            <input
              id="reg-name"
              type="text"
              class="form-control"
              [class.form-control--error]="fullNameInvalid()"
              formControlName="fullName"
              placeholder="e.g. Alex Morgan"
              autocomplete="name"
            />
            @if (fullNameInvalid()) {
              <span class="field-error">Full name is required (at least 2 characters).</span>
            }
          </div>

          <!-- Email Field -->
          <div class="form-group">
            <label for="reg-email" class="form-label">Work Email</label>
            <input
              id="reg-email"
              type="email"
              class="form-control"
              [class.form-control--error]="emailInvalid()"
              formControlName="email"
              placeholder="alex@company.com"
              autocomplete="email"
            />
            @if (emailInvalid()) {
              <span class="field-error">Please enter a valid work email address.</span>
            }
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <label for="reg-password" class="form-label">Password</label>
            <input
              id="reg-password"
              type="password"
              class="form-control"
              [class.form-control--error]="passwordInvalid()"
              formControlName="password"
              placeholder="Minimum 6 characters"
              autocomplete="new-password"
            />
            @if (passwordInvalid()) {
              <span class="field-error">Password must be at least 6 characters.</span>
            }
          </div>

          <!-- Confirm Password Field -->
          <div class="form-group">
            <label for="reg-confirm" class="form-label">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              class="form-control"
              [class.form-control--error]="confirmPasswordInvalid()"
              formControlName="confirmPassword"
              placeholder="Repeat your password"
              autocomplete="new-password"
            />
            @if (confirmPasswordInvalid()) {
              <span class="field-error">Passwords do not match.</span>
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
              <span>Creating account...</span>
            } @else {
              <span>Create Account</span>
            }
          </button>
        </form>

        <!-- Footer / Switch to Login -->
        <footer class="auth-footer">
          <p class="switch-prompt">
            Already have an account?
            <a routerLink="/login" class="auth-link">Sign in</a>
          </p>
        </footer>
      </div>
    </div>
  `,
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly isLoading = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordMatchValidator] }
  );

  protected fullNameInvalid(): boolean {
    const ctrl = this.form.controls.fullName;
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  protected emailInvalid(): boolean {
    const ctrl = this.form.controls.email;
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  protected passwordInvalid(): boolean {
    const ctrl = this.form.controls.password;
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  protected confirmPasswordInvalid(): boolean {
    const ctrl = this.form.controls.confirmPassword;
    const isTouched = ctrl.dirty || ctrl.touched;
    const hasMismatch = this.form.hasError('passwordMismatch');
    return isTouched && (ctrl.invalid || hasMismatch);
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { fullName, email, password } = this.form.getRawValue();

    this.authService
      .register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.notificationService.success('Welcome to TaskPulse!');
          this.router.navigateByUrl('/boards');
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err?.message || 'Registration failed. Please try again.'
          );
        },
      });
  }
}

