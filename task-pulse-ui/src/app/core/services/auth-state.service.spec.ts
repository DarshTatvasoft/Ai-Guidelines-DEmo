import { TestBed } from '@angular/core/testing';
import { AuthStateService } from './auth-state.service';
import { TokenResponse, User } from '../models';

describe('AuthStateService', () => {
  let service: AuthStateService;

  const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsImV4cCI6MTg5MzQ1NjAwMH0.signature';

  const expiredToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsImV4cCI6MTAwMDAwMDAwfQ.signature';

  const mockTokens: TokenResponse = {
    accessToken: validToken,
    refreshToken: 'mock-refresh-token-xyz',
    expiresAt: '2026-11-01T20:00:00Z',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthStateService],
    });
    service = TestBed.inject(AuthStateService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with null user and unauthenticated state', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.accessToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should set session, store tokens, and update signals reactively', () => {
    service.setSession(mockTokens);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getAccessToken()).toBe(validToken);
    expect(service.getRefreshToken()).toBe('mock-refresh-token-xyz');
    expect(service.currentUser()).toEqual(
      jasmine.objectContaining({
        id: 'user-123',
        fullName: 'John Doe',
        email: 'john@example.com',
      })
    );
  });

  it('should set tokens without overwriting existing user', () => {
    const user: User = {
      id: 'existing-id',
      fullName: 'Existing User',
      email: 'exist@example.com',
    };
    service.setSession(mockTokens, user);

    service.setTokens({
      accessToken: 'new-token-123',
      refreshToken: 'new-ref-123',
      expiresAt: '2026-11-01T20:00:00Z',
    });

    expect(service.getAccessToken()).toBe('new-token-123');
    expect(service.getRefreshToken()).toBe('new-ref-123');
    expect(service.currentUser()).toEqual(user);
  });

  it('should decode user from token when setTokens is called without pre-existing user', () => {
    service.clearSession();
    expect(service.currentUser()).toBeNull();

    service.setTokens(mockTokens);

    expect(service.currentUser()).toEqual(
      jasmine.objectContaining({
        id: 'user-123',
        fullName: 'John Doe',
        email: 'john@example.com',
      })
    );
  });

  it('should set session with explicit user override', () => {
    const customUser: User = {
      id: 'custom-id',
      fullName: 'Custom Name',
      email: 'custom@example.com',
      avatarUrl: 'https://example.com/avatar.png',
    };

    service.setSession(mockTokens, customUser);

    expect(service.currentUser()).toEqual(customUser);
  });

  it('should clear session and reset all reactive signals', () => {
    service.setSession(mockTokens);
    expect(service.isAuthenticated()).toBeTrue();

    service.clearSession();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(localStorage.getItem('tp_access_token')).toBeNull();
  });

  it('should identify valid vs expired tokens', () => {
    expect(service.hasValidAccessToken()).toBeFalse();

    service.setSession(mockTokens);
    expect(service.hasValidAccessToken()).toBeTrue();

    service.setSession({
      ...mockTokens,
      accessToken: expiredToken,
    });
    expect(service.hasValidAccessToken()).toBeFalse();

    service.setSession({
      ...mockTokens,
      accessToken: 'invalid.token',
    });
    expect(service.hasValidAccessToken()).toBeFalse();
  });
});
