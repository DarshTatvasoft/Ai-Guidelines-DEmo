/**
 * ProblemDetails — RFC 7807 Problem Details for HTTP APIs.
 * Standard format for HTTP API error responses.
 */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]> | string[];
  [key: string]: unknown;
}

/**
 * AppHttpError — Normalized error structure consumable across Angular components and services.
 */
export interface AppHttpError {
  status: number;
  title: string;
  message: string;
  detail?: string;
  errors: string[];
  validationErrors?: Record<string, string[]>;
  raw?: unknown;
}

