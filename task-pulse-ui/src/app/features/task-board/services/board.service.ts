import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models';
import {
  BoardDetail,
  BoardSummary,
  CreateBoardRequest,
  Column,
  CreateColumnRequest,
  UpdateColumnRequest,
  TaskItem,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  User,
} from '../models';
import { UserService } from './user.service';

/**
 * BoardService — HTTP client operations for boards, columns, and tasks.
 */
@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);

  getBoards(): Observable<ApiResponse<BoardSummary[]>> {
    return this.http.get<ApiResponse<BoardSummary[]>>('/api/v1/boards');
  }

  getBoardById(id: string): Observable<ApiResponse<BoardDetail>> {
    return this.http.get<ApiResponse<BoardDetail>>(`/api/v1/boards/${id}`);
  }

  createBoard(request: CreateBoardRequest): Observable<ApiResponse<BoardDetail>> {
    return this.http.post<ApiResponse<BoardDetail>>('/api/v1/boards', request);
  }

  createColumn(boardId: string, request: CreateColumnRequest): Observable<ApiResponse<Column>> {
    return this.http.post<ApiResponse<Column>>(`/api/v1/boards/${boardId}/columns`, request);
  }

  updateColumn(columnId: string, request: UpdateColumnRequest): Observable<ApiResponse<Column>> {
    return this.http.put<ApiResponse<Column>>(`/api/v1/columns/${columnId}`, request);
  }

  deleteColumn(columnId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`/api/v1/columns/${columnId}`);
  }

  createTask(columnId: string, request: CreateTaskRequest): Observable<ApiResponse<TaskItem>> {
    return this.http.post<ApiResponse<TaskItem>>(`/api/v1/columns/${columnId}/tasks`, request);
  }

  updateTask(taskId: string, request: UpdateTaskRequest): Observable<ApiResponse<TaskItem>> {
    return this.http.put<ApiResponse<TaskItem>>(`/api/v1/tasks/${taskId}`, request);
  }

  moveTask(taskId: string, request: MoveTaskRequest): Observable<ApiResponse<TaskItem>> {
    return this.http.patch<ApiResponse<TaskItem>>(`/api/v1/tasks/${taskId}/move`, request);
  }

  deleteTask(taskId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`/api/v1/tasks/${taskId}`);
  }

  // User assignment delegates
  getUsers(): Observable<ApiResponse<User[]>> {
    return this.userService.getUsers();
  }

  assignTask(taskId: string, userId: string | null): Observable<ApiResponse<TaskItem>> {
    return this.userService.assignTask(taskId, userId);
  }
}

