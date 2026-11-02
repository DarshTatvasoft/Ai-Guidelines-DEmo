import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TokenRefreshCoordinator } from '../services/token-refresh-coordinator.service';
import { NotificationService } from '../services/notification.service';
import { AppHttpError, ProblemDetails } from '../models';

/**
 * ErrorInterceptor — Functional HTTP interceptor that catches 401 Unauthorized errors,
 * orchestrates refresh token rotation and request retry, and normalizes RFC 7807 error responses.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const coordinator = inject(TokenRefreshCoordinator);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 Unauthorized: Attempt token refresh & request retry
      if (error.status === 401 && !coordinator.isAuthEndpoint(req.url)) {
        return coordinator.handle401(req, next);
      }

      const appError = parseHttpError(error);

      // Surface notification toast unless explicitly bypassed
      if (!req.headers.has('X-Skip-Error-Toast')) {
        notificationService.error(appError.message, appError.title);
      }

      console.error(`[HTTP ${appError.status}] ${appError.title}: ${appError.message}`, {
        url: req.url,
        error: appError,
      });

      return throwError(() => appError);
    })
  );
};

/**
 * Backward compatibility alias for errorInterceptor.
 */
export const httpErrorInterceptor: HttpInterceptorFn = errorInterceptor;

/**
 * Parses HttpErrorResponse into standardized AppHttpError supporting RFC 7807 Problem Details.
 */
function parseHttpError(error: HttpErrorResponse): AppHttpError {
  let title = 'Request Failed';
  let message = 'An unexpected error occurred. Please try again.';
  let detail: string | undefined;
  const errorsList: string[] = [];
  let validationErrors: Record<string, string[]> | undefined;

  if (error.status === 0) {
    title = 'Connection Error';
    message = 'Unable to reach the server. Please check your network connection.';
    return {
      status: 0,
      title,
      message,
      errors: [message],
      raw: error,
    };
  }

  const body = error.error;

  // Case 1: RFC 7807 Problem Details object
  if (body && typeof body === 'object') {
    const problem = body as ProblemDetails;

    if (problem.title) {
      title = problem.title;
    }
    if (problem.detail) {
      detail = problem.detail;
      message = problem.detail;
    }

    if (problem.errors) {
      if (Array.isArray(problem.errors)) {
        errorsList.push(...problem.errors);
      } else if (typeof problem.errors === 'object') {
        validationErrors = problem.errors as Record<string, string[]>;
        for (const [field, fieldErrors] of Object.entries(validationErrors)) {
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach((fe) => errorsList.push(`${field}: ${fe}`));
          }
        }
      }
    }

    // Case 2: TaskPulse ApiResponse<T> envelope ({ success: false, message: string, errors: string[] })
    if (body.message && !problem.detail) {
      message = body.message;
    }
    if (Array.isArray(body.errors) && errorsList.length === 0) {
      errorsList.push(...body.errors);
    }
  } else if (typeof body === 'string' && body.trim().length > 0) {
    message = body;
  }

  if (errorsList.length > 0 && (!detail || detail === message)) {
    message = errorsList[0];
  } else if (!message || message === 'An unexpected error occurred. Please try again.') {
    switch (error.status) {
      case 400:
        title = 'Bad Request';
        message = 'The request was invalid. Please verify your input.';
        break;
      case 401:
        title = 'Unauthorized';
        message = 'Your session has expired or is invalid. Please log in.';
        break;
      case 403:
        title = 'Access Denied';
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        title = 'Not Found';
        message = 'The requested resource could not be found.';
        break;
      case 409:
        title = 'Conflict';
        message = 'A conflict occurred with the current state of the resource.';
        break;
      case 500:
        title = 'Server Error';
        message = 'An internal server error occurred. Please try again later.';
        break;
    }
  }

  return {
    status: error.status,
    title,
    message,
    detail,
    errors: errorsList.length > 0 ? errorsList : [message],
    validationErrors,
    raw: body,
  };
}

