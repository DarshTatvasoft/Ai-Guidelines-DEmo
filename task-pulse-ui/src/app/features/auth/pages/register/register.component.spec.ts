import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService, NotificationService } from '../../../../core/services';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize form as invalid when empty', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('should detect password mismatch', () => {
    component.form.setValue({
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      password: 'password123',
      confirmPassword: 'password456',
    });

    expect(component.form.hasError('passwordMismatch')).toBeTrue();
    expect(component.form.valid).toBeFalse();

    component.form.controls.confirmPassword.setValue('password123');
    expect(component.form.hasError('passwordMismatch')).toBeFalse();
    expect(component.form.valid).toBeTrue();
  });

  it('should call authService.register and navigate on submit success', () => {
    authServiceSpy.register.and.returnValue(
      of({
        success: true,
        message: 'Registered',
        data: {
          accessToken: 'fake-jwt',
          refreshToken: 'fake-refresh',
          expiresAt: '2026-11-01T20:00:00Z',
        },
        errors: [],
      })
    );

    component.form.setValue({
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    (component as any).onSubmit();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      password: 'password123',
    });
    expect(notificationServiceSpy.success).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/boards');
  });

  it('should display error message when registration fails', () => {
    authServiceSpy.register.and.returnValue(
      throwError(() => ({ message: 'Email already in use' }))
    );

    component.form.setValue({
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    (component as any).onSubmit();

    expect((component as any).errorMessage()).toBe('Email already in use');
    expect((component as any).isLoading()).toBeFalse();
  });
});

