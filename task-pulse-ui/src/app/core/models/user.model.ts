import type { BaseEntity } from './base-entity.model';

/**
 * UserProfile — Represents the authenticated user profile.
 */
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

/**
 * User — Alias for UserProfile.
 */
export type User = UserProfile;

/**
 * UserDto — User contract returned by backend users endpoints.
 */
export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

/**
 * TokenResponse — JWT access and refresh token pair with expiration.
 * Matches backend TokenResponseDto.
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

/**
 * AuthTokens — Alias for TokenResponse for backward compatibility.
 */
export type AuthTokens = TokenResponse;

/**
 * LoginRequest — Payload for POST /api/v1/auth/login.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * RegisterRequest — Payload for POST /api/v1/auth/register.
 */
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

/**
 * RefreshTokenRequest — Payload for POST /api/v1/auth/refresh.
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}
