import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { NotificationService } from '../../../core/services';
import { UserService } from './user.service';
import { BoardService } from './board.service';
import {
  BoardDetail,
  Column,
  CreateTaskRequest,
  MoveTaskRequest,
  TaskItem,
  TaskPriority,
  UpdateTaskRequest,
  User,
} from '../models';

/**
 * TaskStateService — Reactive state store for Kanban board using Angular Signals.
 * Handles optimistic updates for user assignments and task transitions with automatic rollback.
 */
@Injectable({ providedIn: 'root' })
export class TaskStateService {
  private readonly userService = inject(UserService);
  private readonly boardService = inject(BoardService);
  private readonly notificationService = inject(NotificationService);

  /** Active board details including columns and tasks */
  readonly board = signal<BoardDetail | null>(null);

  /** Registered users available for assignment */
  readonly users = signal<User[]>([]);

  /** Real-time search filter string */
  readonly searchTerm = signal<string>('');

  /** Active priority pill filter */
  readonly priorityFilter = signal<TaskPriority | null>(null);

  /** Active assignee filter (UserId or null) */
  readonly assigneeFilter = signal<string | null>(null);

  /** Global loading state */
  readonly loading = signal<boolean>(false);

  /** Task currently undergoing an assignment operation */
  readonly assigningTaskId = signal<string | null>(null);

  /** Total count of tasks across all columns */
  readonly totalTaskCount = computed(() => {
    const current = this.board();
    if (!current) return 0;
    return current.columns.reduce((sum, col) => sum + col.tasks.length, 0);
  });

  /**
   * Computed slice of columns with tasks filtered by search text, priority, and assignee.
   */
  readonly filteredColumns = computed(() => {
    const currentBoard = this.board();
    if (!currentBoard) return [];

    const search = this.searchTerm().trim().toLowerCase();
    const priority = this.priorityFilter();
    const assignee = this.assigneeFilter();

    return currentBoard.columns.map((col) => {
      const filteredTasks = col.tasks.filter((task) => {
        // Search text matching title or description
        if (search) {
          const matchTitle = task.title.toLowerCase().includes(search);
          const matchDesc = task.description?.toLowerCase().includes(search) ?? false;
          if (!matchTitle && !matchDesc) return false;
        }

        // Priority filter
        if (priority !== null && task.priority !== priority) {
          return false;
        }

        // Assignee filter
        if (assignee !== null) {
          if (assignee === 'unassigned') {
            if (task.assigneeId) return false;
          } else if (task.assigneeId !== assignee) {
            return false;
          }
        }

        return true;
      });

      return {
        ...col,
        tasks: filteredTasks,
      };
    });
  });

  /**
   * Initializes or updates board state.
   */
  setBoard(board: BoardDetail): void {
    this.board.set(board);
  }

  /**
   * Sets user list in state.
   */
  setUsers(users: User[]): void {
    this.users.set(users);
  }

  /**
   * Loads board data from API.
   */
  loadBoard(boardId?: string): Observable<BoardDetail> {
    this.loading.set(true);

    const call$ = boardId
      ? this.boardService.getBoardById(boardId)
      : this.boardService.getBoards().pipe(
          map((res) => res.data[0]?.id),
          map((firstId) => {
            if (!firstId) throw new Error('No boards available');
            return firstId;
          }),
          tap((id) => this.boardService.getBoardById(id))
        );

    return new Observable<BoardDetail>((observer) => {
      this.boardService.getBoards().subscribe({
        next: (boardsRes) => {
          const targetId = boardId ?? boardsRes.data[0]?.id;
          if (!targetId) {
            this.loading.set(false);
            observer.error(new Error('No boards found'));
            return;
          }

          this.boardService.getBoardById(targetId).subscribe({
            next: (boardRes) => {
              this.board.set(boardRes.data);
              this.loading.set(false);
              observer.next(boardRes.data);
              observer.complete();
            },
            error: (err) => {
              this.loading.set(false);
              observer.error(err);
            },
          });
        },
        error: (err) => {
          this.loading.set(false);
          observer.error(err);
        },
      });
    });
  }

  /**
   * Fetches users from the API and updates state signal.
   */
  loadUsers(): Observable<User[]> {
    return new Observable<User[]>((observer) => {
      this.userService.getUsers().subscribe({
        next: (response) => {
          this.users.set(response.data);
          observer.next(response.data);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        },
      });
    });
  }

  /**
   * Optimistically updates task assignee in the local Signal state,
   * dispatches the backend PATCH request, and rolls back with notification on failure.
   */
  assignUserOptimistically(
    taskId: string,
    userId: string | null
  ): Observable<TaskItem> {
    const currentBoard = this.board();
    if (!currentBoard) {
      return throwError(() => new Error('No board loaded'));
    }

    const boardSnapshot: BoardDetail = JSON.parse(JSON.stringify(currentBoard));

    const assignedUser = userId
      ? this.users().find((u) => u.id.toLowerCase() === userId.toLowerCase()) ?? null
      : null;

    this.assigningTaskId.set(taskId);
    let taskFound = false;

    const updatedColumns = currentBoard.columns.map((column) => {
      const taskIndex = column.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return column;

      taskFound = true;
      const updatedTasks = [...column.tasks];
      const targetTask = updatedTasks[taskIndex];

      updatedTasks[taskIndex] = {
        ...targetTask,
        assigneeId: userId,
        assigneeName: assignedUser ? assignedUser.fullName : null,
        assignee: assignedUser,
      };

      return {
        ...column,
        tasks: updatedTasks,
      };
    });

    if (!taskFound) {
      this.assigningTaskId.set(null);
      return throwError(() => new Error(`Task ${taskId} not found`));
    }

    this.board.set({
      ...currentBoard,
      columns: updatedColumns,
    });

    return this.userService.assignTask(taskId, userId).pipe(
      tap((response) => {
        this.assigningTaskId.set(null);
        this.syncTask(response.data);
      }),
      map((response) => response.data),
      catchError((error) => {
        this.board.set(boardSnapshot);
        this.assigningTaskId.set(null);
        this.notificationService.error(
          'Failed to update task assignment. Changes were rolled back.',
          'Assignment Error'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Creates task with optimistic UI and rolls back on failure.
   */
  createTaskOptimistically(
    columnId: string,
    request: CreateTaskRequest
  ): Observable<TaskItem> {
    const currentBoard = this.board();
    if (!currentBoard) {
      return throwError(() => new Error('No board loaded'));
    }

    const boardSnapshot: BoardDetail = JSON.parse(JSON.stringify(currentBoard));
    const tempId = 'temp-' + Date.now();
    const assignedUser = request.assigneeId
      ? this.users().find((u) => u.id === request.assigneeId) ?? null
      : null;

    const optimisticTask: TaskItem = {
      id: tempId,
      columnId,
      title: request.title,
      description: request.description ?? null,
      position: 9999,
      priority: request.priority ?? TaskPriority.Medium,
      dueDate: request.dueDate ?? null,
      assigneeId: request.assigneeId ?? null,
      assigneeName: assignedUser?.fullName ?? null,
      assignee: assignedUser,
      labels: [],
      createdAt: new Date().toISOString(),
    };

    const updatedColumns = currentBoard.columns.map((col) => {
      if (col.id !== columnId) return col;
      return {
        ...col,
        tasks: [...col.tasks, optimisticTask],
      };
    });

    this.board.set({ ...currentBoard, columns: updatedColumns });

    return this.boardService.createTask(columnId, request).pipe(
      tap((response) => {
        // Replace temp task with real task
        const boardAfterSave = this.board();
        if (!boardAfterSave) return;

        const syncedColumns = boardAfterSave.columns.map((col) => {
          if (col.id !== columnId) return col;
          const cleanedTasks = col.tasks.filter((t) => t.id !== tempId);
          return {
            ...col,
            tasks: [...cleanedTasks, response.data],
          };
        });

        this.board.set({ ...boardAfterSave, columns: syncedColumns });
        this.notificationService.success('Task created successfully.');
      }),
      map((res) => res.data),
      catchError((err) => {
        this.board.set(boardSnapshot);
        this.notificationService.error('Failed to create task.', 'Creation Failed');
        return throwError(() => err);
      })
    );
  }

  /**
   * Updates task with optimistic state.
   */
  updateTaskOptimistically(
    taskId: string,
    request: UpdateTaskRequest
  ): Observable<TaskItem> {
    const currentBoard = this.board();
    if (!currentBoard) return throwError(() => new Error('No board loaded'));

    const boardSnapshot: BoardDetail = JSON.parse(JSON.stringify(currentBoard));
    const assignedUser = request.assigneeId
      ? this.users().find((u) => u.id === request.assigneeId) ?? null
      : null;

    const updatedColumns = currentBoard.columns.map((col) => {
      const idx = col.tasks.findIndex((t) => t.id === taskId);
      if (idx === -1) return col;

      const tasks = [...col.tasks];
      tasks[idx] = {
        ...tasks[idx],
        title: request.title,
        description: request.description ?? null,
        priority: request.priority,
        dueDate: request.dueDate ?? null,
        assigneeId: request.assigneeId ?? null,
        assigneeName: assignedUser?.fullName ?? null,
        assignee: assignedUser,
      };

      return { ...col, tasks };
    });

    this.board.set({ ...currentBoard, columns: updatedColumns });

    return this.boardService.updateTask(taskId, request).pipe(
      tap((res) => {
        this.syncTask(res.data);
        this.notificationService.success('Task updated successfully.');
      }),
      map((res) => res.data),
      catchError((err) => {
        this.board.set(boardSnapshot);
        this.notificationService.error('Failed to update task.');
        return throwError(() => err);
      })
    );
  }

  /**
   * Deletes task optimistically.
   */
  deleteTaskOptimistically(taskId: string): Observable<void> {
    const currentBoard = this.board();
    if (!currentBoard) return throwError(() => new Error('No board loaded'));

    const boardSnapshot: BoardDetail = JSON.parse(JSON.stringify(currentBoard));

    const updatedColumns = currentBoard.columns.map((col) => {
      return {
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      };
    });

    this.board.set({ ...currentBoard, columns: updatedColumns });

    return this.boardService.deleteTask(taskId).pipe(
      tap(() => {
        this.notificationService.success('Task deleted successfully.');
      }),
      map(() => void 0),
      catchError((err) => {
        this.board.set(boardSnapshot);
        this.notificationService.error('Failed to delete task.');
        return throwError(() => err);
      })
    );
  }

  /**
   * Optimistically moves a task within the same column or to another column,
   * updates the local Signal state immediately, sends the PATCH request,
   * and automatically rolls back if the backend fails (e.g. WIP limit exceeded or network error).
   */
  moveTaskOptimistically(
    taskId: string,
    targetColumnId: string,
    newPosition: number
  ): Observable<TaskItem> {
    const currentBoard = this.board();
    if (!currentBoard) return throwError(() => new Error('No board loaded'));

    const boardSnapshot: BoardDetail = JSON.parse(JSON.stringify(currentBoard));

    let sourceColIndex = -1;
    let taskIndex = -1;
    let taskToMove: TaskItem | null = null;

    for (let c = 0; c < currentBoard.columns.length; c++) {
      const idx = currentBoard.columns[c].tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        sourceColIndex = c;
        taskIndex = idx;
        taskToMove = currentBoard.columns[c].tasks[idx];
        break;
      }
    }

    if (!taskToMove || sourceColIndex === -1) {
      return throwError(() => new Error(`Task ${taskId} not found`));
    }

    const targetColIndex = currentBoard.columns.findIndex((c) => c.id === targetColumnId);
    if (targetColIndex === -1) {
      return throwError(() => new Error(`Column ${targetColumnId} not found`));
    }

    const updatedColumns = currentBoard.columns.map((col) => ({
      ...col,
      tasks: [...col.tasks],
    }));

    if (sourceColIndex === targetColIndex) {
      const tasks = updatedColumns[sourceColIndex].tasks;
      const [removed] = tasks.splice(taskIndex, 1);
      const clamped = Math.max(0, Math.min(newPosition, tasks.length));
      tasks.splice(clamped, 0, removed);
      tasks.forEach((t, i) => (t.position = i));
    } else {
      const sourceTasks = updatedColumns[sourceColIndex].tasks;
      const targetTasks = updatedColumns[targetColIndex].tasks;

      const [removed] = sourceTasks.splice(taskIndex, 1);
      const movedTask: TaskItem = {
        ...removed,
        columnId: targetColumnId,
      };
      const clamped = Math.max(0, Math.min(newPosition, targetTasks.length));
      targetTasks.splice(clamped, 0, movedTask);

      sourceTasks.forEach((t, i) => (t.position = i));
      targetTasks.forEach((t, i) => (t.position = i));
    }

    this.board.set({ ...currentBoard, columns: updatedColumns });

    return this.boardService
      .moveTask(taskId, { targetColumnId, newPosition })
      .pipe(
        tap((res) => {
          this.syncTask(res.data);
        }),
        map((res) => res.data),
        catchError((err) => {
          this.board.set(boardSnapshot);
          this.notificationService.error(
            'Failed to move task. Reverting position.',
            'Move Error'
          );
          return throwError(() => err);
        })
      );
  }

  syncTask(canonicalTask: TaskItem): void {
    const currentBoard = this.board();
    if (!currentBoard) return;

    const updatedColumns = currentBoard.columns.map((col) => {
      const index = col.tasks.findIndex((t) => t.id === canonicalTask.id);
      if (index === -1) return col;

      const updatedTasks = [...col.tasks];
      updatedTasks[index] = { ...updatedTasks[index], ...canonicalTask };
      return { ...col, tasks: updatedTasks };
    });

    this.board.set({ ...currentBoard, columns: updatedColumns });
  }

  updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  setPriorityFilter(priority: TaskPriority | null): void {
    this.priorityFilter.set(priority);
  }

  setAssigneeFilter(userId: string | null): void {
    this.assigneeFilter.set(userId);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.priorityFilter.set(null);
    this.assigneeFilter.set(null);
  }
}
