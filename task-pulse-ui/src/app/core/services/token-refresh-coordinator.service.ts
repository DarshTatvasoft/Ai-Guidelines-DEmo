import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AuthStateService } from './auth-state.service';

/**
 * TokenRefreshCoordinator — Coordinates seamless JWT refresh token rotation.
 * Queues concurrent requests during an active refresh cycle and retries them once new tokens arrive.
 */
@Injectable({ providedIn: 'root' })
export class TokenRefreshCoordinator {
  private readonly authService = inject(AuthService);
  private readonly authState = inject(AuthStateService);

  private isRefreshing = false;
  private readonly refreshTokenSubject = new BehaviorSubject<string | null>(null);

  /**
   * Determines if a request is an authentication endpoint that should bypass automatic refresh retry.
   */
  isAuthEndpoint(url: string): boolean {
    return (
      url.includes('/api/v1/auth/login') ||
      url.includes('/api/v1/auth/register') ||
      url.includes('/api/v1/auth/refresh')
    );
  }

  /**
   * Handles 401 Unauthorized response by refreshing access token and retrying the request.
   */
  handle401(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    if (this.isAuthEndpoint(req.url)) {
      this.authState.clearSession();
      return throwError(() => new Error('Authentication failed'));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.authState.getRefreshToken();
      if (!refreshToken) {
        this.isRefreshing = false;
        this.authState.clearSession();
        return throwError(() => new Error('No refresh token available'));
      }

      return this.authService.refreshToken().pipe(
        switchMap((response) => {
          this.isRefreshing = false;
          const newAccessToken = response.data.accessToken;
          this.refreshTokenSubject.next(newAccessToken);
          return next(this.cloneWithToken(req, newAccessToken));
        }),
        catchError((refreshErr) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          this.authState.clearSession();
          return throwError(() => refreshErr);
        })
      );
    }

    // Queue pending requests while token refresh is in flight
    return this.refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => next(this.cloneWithToken(req, token)))
    );
  }

  private cloneWithToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

