import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { apiUrlInterceptor } from './api-url.interceptor';
import { environment } from '../../../environments/environment';

describe('apiUrlInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should prefix relative /api/ endpoints with environment.apiUrl', () => {
    httpClient.get('/api/v1/boards').subscribe();

    const expectedUrl = `${environment.apiUrl}/api/v1/boards`;
    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.url).toBe(expectedUrl);
    req.flush({});
  });

  it('should not modify external or absolute URLs', () => {
    const externalUrl = 'https://other-api.example.com/data';
    httpClient.get(externalUrl).subscribe();

    const req = httpMock.expectOne(externalUrl);
    expect(req.request.url).toBe(externalUrl);
    req.flush({});
  });
});

