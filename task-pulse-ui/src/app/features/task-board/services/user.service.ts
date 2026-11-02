import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models';
import { User, TaskItem, AssignUserRequest } from '../models';

/**
 * UserService — Handles user listing and task assignment API operations.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  /**
   * Fetches all registered users available for task assignment.
   */
  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>('/api/v1/users');
  }

  /**
   * Assigns or unassigns a user to a task card. Pass null userId to unassign.
   */
  assignTask(taskId: string, userId: string | null): Observable<ApiResponse<TaskItem>> {
    const payload: AssignUserRequest = { userId };
    return this.http.patch<ApiResponse<TaskItem>>(`/api/v1/tasks/${taskId}/assign`, payload);
  }
}

