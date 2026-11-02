import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthStateService } from '../services/auth-state.service';

describe('jwtInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authState: AuthStateService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthStateService,
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authState = TestBed.inject(AuthStateService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add Authorization Bearer header when token is present', () => {
    spyOn(authState, 'getAccessToken').and.returnValue('valid-test-token');

    httpClient.get('/api/v1/boards').subscribe();

    const req = httpMock.expectOne('/api/v1/boards');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-test-token');
    req.flush({});
  });

  it('should not add Authorization header when token is absent', () => {
    spyOn(authState, 'getAccessToken').and.returnValue(null);

    httpClient.get('/api/v1/boards').subscribe();

    const req = httpMock.expectOne('/api/v1/boards');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should not overwrite existing Authorization header', () => {
    spyOn(authState, 'getAccessToken').and.returnValue('token-from-state');

    httpClient
      .get('/api/v1/boards', {
        headers: { Authorization: 'Custom existing-auth' },
      })
      .subscribe();

    const req = httpMock.expectOne('/api/v1/boards');
    expect(req.request.headers.get('Authorization')).toBe('Custom existing-auth');
    req.flush({});
  });
});

