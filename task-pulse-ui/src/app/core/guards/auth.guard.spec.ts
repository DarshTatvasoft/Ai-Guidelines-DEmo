import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthStateService } from '../services';

describe('authGuard', () => {
  let authStateSpy: jasmine.SpyObj<AuthStateService>;
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/boards' } as RouterStateSnapshot;

  beforeEach(() => {
    authStateSpy = jasmine.createSpyObj('AuthStateService', [], {
      isAuthenticated: () => false,
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStateService, useValue: authStateSpy },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should allow access when user is authenticated', () => {
    Object.defineProperty(authStateSpy, 'isAuthenticated', {
      value: () => true,
    });

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBeTrue();
  });

  it('should redirect to /login with returnUrl query param when user is not authenticated', () => {
    Object.defineProperty(authStateSpy, 'isAuthenticated', {
      value: () => false,
    });

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result instanceof UrlTree).toBeTrue();
    const urlTree = result as UrlTree;
    expect(urlTree.queryParams['returnUrl']).toBe('/boards');
  });
});

