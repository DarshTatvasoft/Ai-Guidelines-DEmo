/**
 * ApiResponse<T> — Standard API response envelope.
 * Matches the backend ApiResponse<T> contract from TaskPulse.API.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

