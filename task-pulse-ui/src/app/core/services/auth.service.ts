import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthStateService } from './auth-state.service';
import {
  ApiResponse,
  TokenResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
} from '../models';

/**
 * AuthService — Handles authentication HTTP calls and delegates session state to AuthStateService.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router, { optional: true });

  /**
   * Registers a new user account.
   */
  register(request: RegisterRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http
      .post<ApiResponse<TokenResponse>>('/api/v1/auth/register', request)
      .pipe(tap((response) => this.authState.setSession(response.data)));
  }

  /**
   * Authenticates user with email & password.
   */
  login(request: LoginRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http
      .post<ApiResponse<TokenResponse>>('/api/v1/auth/login', request)
      .pipe(tap((response) => this.authState.setSession(response.data)));
  }

  /**
   * Refreshes the JWT access token using the stored refresh token.
   */
  refreshToken(): Observable<ApiResponse<TokenResponse>> {
    const refreshToken = this.authState.getRefreshToken();
    const payload: RefreshTokenRequest = { refreshToken: refreshToken ?? '' };

    return this.http
      .post<ApiResponse<TokenResponse>>('/api/v1/auth/refresh', payload)
      .pipe(tap((response) => this.authState.setTokens(response.data)));
  }

  /**
   * Logs out user and clears the session state.
   */
  logout(): void {
    this.authState.clearSession();
    this.router?.navigate(['/login']);
  }

  // Convenience delegates for backwards-compatibility
  get isAuthenticated() {
    return this.authState.isAuthenticated;
  }

  get currentUser() {
    return this.authState.currentUser;
  }

  getAccessToken(): string | null {
    return this.authState.getAccessToken();
  }

  getRefreshToken(): string | null {
    return this.authState.getRefreshToken();
  }

  setTokens(tokens: TokenResponse): void {
    this.authState.setSession(tokens);
  }

  clearTokens(): void {
    this.authState.clearSession();
  }
}
