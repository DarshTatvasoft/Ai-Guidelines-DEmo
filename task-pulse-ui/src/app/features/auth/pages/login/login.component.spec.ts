import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService, NotificationService } from '../../../../core/services';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize form as invalid when empty', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('should validate email format and minimum password length', () => {
    const emailCtrl = component.form.controls.email;
    const passCtrl = component.form.controls.password;

    emailCtrl.setValue('not-an-email');
    passCtrl.setValue('123');
    expect(emailCtrl.valid).toBeFalse();
    expect(passCtrl.valid).toBeFalse();

    emailCtrl.setValue('user@example.com');
    passCtrl.setValue('validPassword123');
    expect(emailCtrl.valid).toBeTrue();
    expect(passCtrl.valid).toBeTrue();
    expect(component.form.valid).toBeTrue();
  });

  it('should call authService.login and navigate on submit success', () => {
    authServiceSpy.login.and.returnValue(
      of({
        success: true,
        message: 'Logged in',
        data: {
          accessToken: 'fake-jwt',
          refreshToken: 'fake-refresh',
          expiresAt: '2026-11-01T20:00:00Z',
        },
        errors: [],
      })
    );

    component.form.setValue({
      email: 'user@example.com',
      password: 'password123',
    });

    (component as any).onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(notificationServiceSpy.success).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/boards');
  });

  it('should display error message when login fails', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => ({ message: 'Invalid credentials' }))
    );

    component.form.setValue({
      email: 'user@example.com',
      password: 'wrongpassword',
    });

    (component as any).onSubmit();

    expect((component as any).errorMessage()).toBe('Invalid credentials');
    expect((component as any).isLoading()).toBeFalse();
  });
});

