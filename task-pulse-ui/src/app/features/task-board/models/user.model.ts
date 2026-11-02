/**
 * User — Represents a user for task assignment and profile display.
 * Matches backend UserDto.
 */
export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

/**
 * AssignUserRequest — Request contract for PATCH /api/v1/tasks/{taskId}/assign.
 */
export interface AssignUserRequest {
  userId: string | null;
}

