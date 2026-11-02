import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';
import { AuthStateService } from '../services/auth-state.service';
import { NotificationService } from '../services/notification.service';
import { TokenRefreshCoordinator } from '../services/token-refresh-coordinator.service';
import { AppHttpError } from '../models';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let authState: AuthStateService;
  let notificationService: NotificationService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthStateService,
        NotificationService,
        TokenRefreshCoordinator,
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    authState = TestBed.inject(AuthStateService);
    notificationService = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should refresh token on 401 and retry original request with new token', (done) => {
    spyOn(authState, 'getRefreshToken').and.returnValue('valid-refresh-token');
    spyOn(authService, 'refreshToken').and.returnValue(
      of({
        success: true,
        message: 'Refreshed',
        data: {
          accessToken: 'fresh-new-jwt-token',
          refreshToken: 'rotated-refresh-token',
          expiresAt: '2026-11-01T20:00:00Z',
        },
        errors: [],
      })
    );

    httpClient.get<{ name: string }>('/api/v1/boards').subscribe({
      next: (res) => {
        expect(res.name).toBe('Board 1');
        done();
      },
      error: () => fail('Expected request to succeed after token refresh retry'),
    });

    // 1. Initial request fails with 401
    const req1 = httpMock.expectOne('/api/v1/boards');
    req1.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

    // 2. Retried request with new Authorization header
    const reqRetry = httpMock.expectOne('/api/v1/boards');
    expect(reqRetry.request.headers.get('Authorization')).toBe('Bearer fresh-new-jwt-token');
    reqRetry.flush({ name: 'Board 1' });
  });

  it('should queue concurrent 401 requests and retry all once refresh finishes', (done) => {
    spyOn(authState, 'getRefreshToken').and.returnValue('valid-refresh-token');
    spyOn(authService, 'refreshToken').and.returnValue(
      of({
        success: true,
        message: 'Refreshed',
        data: {
          accessToken: 'refreshed-queued-token',
          refreshToken: 'rot-token',
          expiresAt: '2026-11-01T20:00:00Z',
        },
        errors: [],
      })
    );

    let completedCount = 0;
    const checkDone = () => {
      completedCount++;
      if (completedCount === 2) done();
    };

    httpClient.get('/api/v1/boards').subscribe({ next: () => checkDone() });
    httpClient.get('/api/v1/columns').subscribe({ next: () => checkDone() });

    // First request triggers 401 and initiates refresh
    const req1 = httpMock.expectOne('/api/v1/boards');
    req1.flush({}, { status: 401, statusText: 'Unauthorized' });

    // Second request also triggers 401 and joins queue
    const req2 = httpMock.expectOne('/api/v1/columns');
    req2.flush({}, { status: 401, statusText: 'Unauthorized' });

    // Both should now be retried with the refreshed token
    const retry1 = httpMock.expectOne('/api/v1/boards');
    expect(retry1.request.headers.get('Authorization')).toBe('Bearer refreshed-queued-token');
    retry1.flush({ data: 'ok1' });

    const retry2 = httpMock.expectOne('/api/v1/columns');
    expect(retry2.request.headers.get('Authorization')).toBe('Bearer refreshed-queued-token');
    retry2.flush({ data: 'ok2' });
  });

  it('should clear session if refresh fails on 401', (done) => {
    spyOn(authState, 'getRefreshToken').and.returnValue('bad-refresh-token');
    const clearSessionSpy = spyOn(authState, 'clearSession').and.callThrough();
    spyOn(authService, 'refreshToken').and.returnValue(
      throwError(() => new Error('Refresh token revoked'))
    );

    httpClient.get('/api/v1/boards').subscribe({
      next: () => fail('Expected request to fail when refresh fails'),
      error: () => {
        expect(clearSessionSpy).toHaveBeenCalled();
        done();
      },
    });

    const req = httpMock.expectOne('/api/v1/boards');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('should clear session immediately if no refresh token is present on 401', (done) => {
    spyOn(authState, 'getRefreshToken').and.returnValue(null);
    const clearSessionSpy = spyOn(authState, 'clearSession').and.callThrough();

    httpClient.get('/api/v1/boards').subscribe({
      next: () => fail('Expected 401 without refresh token to fail'),
      error: () => {
        expect(clearSessionSpy).toHaveBeenCalled();
        done();
      },
    });

    const req = httpMock.expectOne('/api/v1/boards');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('should not attempt refresh on auth endpoints', (done) => {
    const refreshSpy = spyOn(authService, 'refreshToken');

    httpClient.post('/api/v1/auth/login', {}).subscribe({
      next: () => fail('Expected login 401 to fail directly'),
      error: (err: AppHttpError) => {
        expect(err.status).toBe(401);
        expect(refreshSpy).not.toHaveBeenCalled();
        done();
      },
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should parse RFC 7807 validation problem details and show error toast', (done) => {
    const errorSpy = spyOn(notificationService, 'error').and.callThrough();

    const problemPayload = {
      type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
      title: 'One or more validation errors occurred.',
      status: 400,
      errors: {
        Title: ['The Title field is required.'],
        Email: ['The Email field is invalid.'],
      },
    };

    httpClient.post('/api/v1/tasks', {}).subscribe({
      next: () => fail('Expected error'),
      error: (err: AppHttpError) => {
        expect(err.status).toBe(400);
        expect(err.title).toBe('One or more validation errors occurred.');
        expect(err.errors.length).toBe(2);
        expect(err.validationErrors?.['Title']).toContain('The Title field is required.');
        expect(errorSpy).toHaveBeenCalled();
        done();
      },
    });

    const req = httpMock.expectOne('/api/v1/tasks');
    req.flush(problemPayload, { status: 400, statusText: 'Bad Request' });
  });

  it('should handle network error (status 0)', (done) => {
    httpClient.get('/api/v1/boards').subscribe({
      next: () => fail('Expected error'),
      error: (err: AppHttpError) => {
        expect(err.status).toBe(0);
        expect(err.title).toBe('Connection Error');
        done();
      },
    });

    const req = httpMock.expectOne('/api/v1/boards');
    req.error(new ProgressEvent('error'));
  });

  it('should skip notification toast if X-Skip-Error-Toast header is set', (done) => {
    const errorSpy = spyOn(notificationService, 'error');

    httpClient
      .get('/api/v1/boards', { headers: { 'X-Skip-Error-Toast': 'true' } })
      .subscribe({
        next: () => fail('Expected error'),
        error: () => {
          expect(errorSpy).not.toHaveBeenCalled();
          done();
        },
      });

    const req = httpMock.expectOne('/api/v1/boards');
    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
  });
});
