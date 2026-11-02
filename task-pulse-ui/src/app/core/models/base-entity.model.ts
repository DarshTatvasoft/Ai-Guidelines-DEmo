/**
 * BaseEntity — Common audit & soft-delete fields for all domain entities.
 * Corresponds to BaseEntity in TaskPulse.Domain.Common.
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
}

