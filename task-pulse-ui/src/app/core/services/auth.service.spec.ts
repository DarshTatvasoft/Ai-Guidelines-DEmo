import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthStateService } from './auth-state.service';
import { TokenResponse, LoginRequest, RegisterRequest } from '../models';

describe('AuthService', () => {
  let service: AuthService;
  let authState: AuthStateService;
  let httpMock: HttpTestingController;

  const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsImV4cCI6MTg5MzQ1NjAwMH0.signature';

  const mockTokens: TokenResponse = {
    accessToken: validToken,
    refreshToken: 'mock-refresh-token-12345',
    expiresAt: '2026-11-01T20:00:00Z',
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthStateService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    authState = TestBed.inject(AuthStateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should authenticate user and delegate session to AuthStateService on login', () => {
    const loginReq: LoginRequest = { email: 'john@example.com', password: 'Password123!' };

    service.login(loginReq).subscribe((response) => {
      expect(response.success).toBeTrue();
      expect(response.data.accessToken).toBe(mockTokens.accessToken);
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'Success', data: mockTokens, errors: [] });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getAccessToken()).toBe(mockTokens.accessToken);
    expect(service.getRefreshToken()).toBe(mockTokens.refreshToken);
    expect(service.currentUser()?.email).toBe('john@example.com');
  });

  it('should register user and set session on register', () => {
    const regReq: RegisterRequest = {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
    };

    service.register(regReq).subscribe((response) => {
      expect(response.success).toBeTrue();
    });

    const req = httpMock.expectOne('/api/v1/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'Created', data: mockTokens, errors: [] });

    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should refresh tokens and update session', () => {
    authState.setSession(mockTokens);

    service.refreshToken().subscribe((response) => {
      expect(response.success).toBeTrue();
    });

    const req = httpMock.expectOne('/api/v1/auth/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'mock-refresh-token-12345' });
    req.flush({
      success: true,
      message: 'Refreshed',
      data: { ...mockTokens, accessToken: 'new-access-token' },
      errors: [],
    });

    expect(service.getAccessToken()).toBe('new-access-token');
  });

  it('should clear session on logout', () => {
    authState.setSession(mockTokens);
    expect(service.isAuthenticated()).toBeTrue();

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });
});
