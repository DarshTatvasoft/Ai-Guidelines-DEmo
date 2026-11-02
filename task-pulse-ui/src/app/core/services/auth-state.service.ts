import { Injectable, signal, computed } from '@angular/core';
import { User, TokenResponse } from '../models';

interface JwtPayload {
  exp?: number;
  nameid?: string;
  sub?: string;
  email?: string;
  unique_name?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * AuthStateService — Manages authentication state, user identity, and token storage using Angular Signals.
 */
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly ACCESS_TOKEN_KEY = 'tp_access_token';
  private readonly REFRESH_TOKEN_KEY = 'tp_refresh_token';
  private readonly USER_KEY = 'tp_user_profile';

  /** Reactive signal holding current authenticated user identity. */
  readonly currentUser = signal<User | null>(this.getStoredUser());

  /** Reactive signal holding current access token. */
  readonly accessToken = signal<string | null>(this.getStoredAccessToken());

  /** Reactive computed signal indicating whether a valid user session is active. */
  readonly isAuthenticated = computed(() => !!this.currentUser() && !!this.accessToken());

  /**
   * Sets active session from token response, updates localStorage, and notifies signals.
   */
  setSession(tokens: TokenResponse, user?: User): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    this.accessToken.set(tokens.accessToken);

    const activeUser = user ?? this.decodeUserFromToken(tokens.accessToken);
    if (activeUser) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(activeUser));
      this.currentUser.set(activeUser);
    }
  }

  /**
   * Updates only access and refresh tokens (e.g. after refresh rotation).
   */
  setTokens(tokens: TokenResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    this.accessToken.set(tokens.accessToken);

    // If user profile was not loaded or expired, refresh from token claims
    if (!this.currentUser()) {
      const user = this.decodeUserFromToken(tokens.accessToken);
      if (user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      }
    }
  }

  /**
   * Clears tokens and user profile from storage, resetting reactive signals.
   */
  clearSession(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.accessToken.set(null);
    this.currentUser.set(null);
  }

  /**
   * Retrieves current JWT access token.
   */
  getAccessToken(): string | null {
    return this.accessToken();
  }

  /**
   * Retrieves current refresh token from localStorage.
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Checks whether the current access token exists and is not expired.
   */
  hasValidAccessToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = this.parseJwt(token);
      if (!payload || typeof payload['exp'] !== 'number') return false;
      return Date.now() < payload['exp'] * 1000;
    } catch {
      return false;
    }
  }

  private getStoredAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch {
        // Fallback to token decoding
      }
    }

    const token = this.getStoredAccessToken();
    return token ? this.decodeUserFromToken(token) : null;
  }

  private decodeUserFromToken(token: string): User | null {
    try {
      const payload = this.parseJwt(token);
      if (!payload) return null;

      const id = String(
        payload['nameid'] ??
          payload['sub'] ??
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
          ''
      );
      const email = String(
        payload['email'] ??
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ??
          ''
      );
      const fullName = String(
        payload['unique_name'] ??
          payload['name'] ??
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
          email
      );

      return {
        id,
        email,
        fullName,
        avatarUrl: null,
      };
    } catch {
      return null;
    }
  }

  private parseJwt(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as JwtPayload;
    } catch {
      return null;
    }
  }
}

