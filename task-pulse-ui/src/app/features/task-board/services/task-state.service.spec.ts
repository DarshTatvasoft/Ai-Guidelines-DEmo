import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TaskStateService } from './task-state.service';
import { UserService } from './user.service';
import { BoardService } from './board.service';
import { NotificationService } from '../../../core/services';
import { BoardDetail, TaskItem, TaskPriority, User } from '../models';

describe('TaskStateService', () => {
  let service: TaskStateService;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let boardServiceSpy: jasmine.SpyObj<BoardService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  const mockUsers: User[] = [
    { id: 'user-1', fullName: 'Alice Smith', email: 'alice@example.com' },
    { id: 'user-2', fullName: 'Bob Jones', email: 'bob@example.com' },
  ];

  const initialTask: TaskItem = {
    id: 'task-1',
    columnId: 'col-1',
    title: 'Design Logo',
    description: 'Vector SVG logo',
    position: 0,
    priority: TaskPriority.High,
    assigneeId: null,
    assigneeName: null,
    labels: [],
    createdAt: '2026-11-01T00:00:00Z',
  };

  const mockBoard: BoardDetail = {
    id: 'board-1',
    title: 'Main Sprint Board',
    isActive: true,
    createdAt: '2026-11-01T00:00:00Z',
    columns: [
      {
        id: 'col-1',
        boardId: 'board-1',
        title: 'To Do',
        position: 0,
        colorHex: '#64748B',
        tasks: [initialTask],
      },
    ],
  };

  beforeEach(() => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers', 'assignTask']);
    boardServiceSpy = jasmine.createSpyObj('BoardService', [
      'getBoards',
      'getBoardById',
      'createTask',
      'updateTask',
      'deleteTask',
      'moveTask',
    ]);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['error', 'success']);

    TestBed.configureTestingModule({
      providers: [
        TaskStateService,
        { provide: UserService, useValue: userServiceSpy },
        { provide: BoardService, useValue: boardServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    });

    service = TestBed.inject(TaskStateService);
    service.setBoard(mockBoard);
    service.setUsers(mockUsers);
  });

  it('should initialize with board data and users', () => {
    expect(service.board()).toEqual(mockBoard);
    expect(service.users().length).toBe(2);
    expect(service.filteredColumns()[0].tasks.length).toBe(1);
  });

  it('should update task assignee optimistically and confirm with API result', (done) => {
    const updatedCanonicalTask: TaskItem = {
      ...initialTask,
      assigneeId: 'user-1',
      assigneeName: 'Alice Smith',
    };

    userServiceSpy.assignTask.and.returnValue(
      of({
        success: true,
        message: 'Assigned',
        data: updatedCanonicalTask,
        errors: [],
      })
    );

    service.assignUserOptimistically('task-1', 'user-1').subscribe((result) => {
      expect(result.assigneeId).toBe('user-1');

      // Verify state reflects assigned user
      const taskInState = service.board()!.columns[0].tasks[0];
      expect(taskInState.assigneeId).toBe('user-1');
      expect(taskInState.assigneeName).toBe('Alice Smith');
      done();
    });

    // Synchronous optimistic check before API completes
    expect(service.board()!.columns[0].tasks[0].assigneeId).toBe('user-1');
  });

  it('should roll back optimistic state and show error notification when API fails', (done) => {
    userServiceSpy.assignTask.and.returnValue(
      throwError(() => new Error('Server assignment error'))
    );

    service.assignUserOptimistically('task-1', 'user-1').subscribe({
      next: () => fail('Expected assignment to fail'),
      error: () => {
        // Rolled back to null assignee
        const taskInState = service.board()!.columns[0].tasks[0];
        expect(taskInState.assigneeId).toBeNull();
        expect(notificationServiceSpy.error).toHaveBeenCalled();
        done();
      },
    });
  });

  it('should filter tasks by search term, priority, and assignee', () => {
    // Search filter
    service.updateSearchTerm('Logo');
    expect(service.filteredColumns()[0].tasks.length).toBe(1);

    service.updateSearchTerm('Nonexistent');
    expect(service.filteredColumns()[0].tasks.length).toBe(0);
    service.updateSearchTerm('');

    // Priority filter
    service.setPriorityFilter(TaskPriority.Low);
    expect(service.filteredColumns()[0].tasks.length).toBe(0);

    service.setPriorityFilter(TaskPriority.High);
    expect(service.filteredColumns()[0].tasks.length).toBe(1);
    service.setPriorityFilter(null);

    // Assignee filter: unassigned
    service.setAssigneeFilter('unassigned');
    expect(service.filteredColumns()[0].tasks.length).toBe(1);

    service.setAssigneeFilter('user-2');
    expect(service.filteredColumns()[0].tasks.length).toBe(0);
  });

  it('should move task to a different column optimistically and update position', (done) => {
    // Add second column to board
    const twoColBoard: BoardDetail = {
      ...mockBoard,
      columns: [
        mockBoard.columns[0],
        {
          id: 'col-2',
          boardId: 'board-1',
          title: 'Done',
          position: 1,
          colorHex: '#10B981',
          tasks: [],
        },
      ],
    };
    service.setBoard(twoColBoard);

    const movedTaskResult: TaskItem = {
      ...initialTask,
      columnId: 'col-2',
      position: 0,
    };

    boardServiceSpy.moveTask.and.returnValue(
      of({
        success: true,
        message: 'Moved',
        data: movedTaskResult,
        errors: [],
      })
    );

    service.moveTaskOptimistically('task-1', 'col-2', 0).subscribe((result) => {
      expect(result.columnId).toBe('col-2');
      const b = service.board()!;
      expect(b.columns[0].tasks.length).toBe(0);
      expect(b.columns[1].tasks.length).toBe(1);
      expect(b.columns[1].tasks[0].id).toBe('task-1');
      done();
    });

    // Synchronous optimistic check
    const boardState = service.board()!;
    expect(boardState.columns[0].tasks.length).toBe(0);
    expect(boardState.columns[1].tasks.length).toBe(1);
  });

  it('should revert task move on failure and show notification', (done) => {
    const twoColBoard: BoardDetail = {
      ...mockBoard,
      columns: [
        mockBoard.columns[0],
        {
          id: 'col-2',
          boardId: 'board-1',
          title: 'Done',
          position: 1,
          colorHex: '#10B981',
          tasks: [],
        },
      ],
    };
    service.setBoard(twoColBoard);

    boardServiceSpy.moveTask.and.returnValue(
      throwError(() => new Error('WIP limit exceeded'))
    );

    service.moveTaskOptimistically('task-1', 'col-2', 0).subscribe({
      next: () => fail('Expected move to fail'),
      error: () => {
        const b = service.board()!;
        expect(b.columns[0].tasks.length).toBe(1);
        expect(b.columns[1].tasks.length).toBe(0);
        expect(notificationServiceSpy.error).toHaveBeenCalled();
        done();
      },
    });
  });

  it('should reorder task within same column optimistically', (done) => {
    const secondTask: TaskItem = {
      id: 'task-2',
      columnId: 'col-1',
      title: 'Second Task',
      position: 1,
      priority: TaskPriority.Low,
      labels: [],
      createdAt: '2026-11-01T00:00:00Z',
    };

    const boardWithTwoTasks: BoardDetail = {
      ...mockBoard,
      columns: [
        {
          ...mockBoard.columns[0],
          tasks: [initialTask, secondTask],
        },
      ],
    };
    service.setBoard(boardWithTwoTasks);

    const reorderedTask: TaskItem = { ...initialTask, position: 1 };
    boardServiceSpy.moveTask.and.returnValue(
      of({ success: true, message: 'Moved', data: reorderedTask, errors: [] })
    );

    service.moveTaskOptimistically('task-1', 'col-1', 1).subscribe(() => {
      const tasks = service.board()!.columns[0].tasks;
      expect(tasks[0].id).toBe('task-2');
      expect(tasks[1].id).toBe('task-1');
      done();
    });
  });

  it('should create task optimistically and replace with saved task', (done) => {
    const realCreatedTask: TaskItem = {
      id: 'task-real-99',
      columnId: 'col-1',
      title: 'Real Task',
      position: 1,
      priority: TaskPriority.Medium,
      labels: [],
      createdAt: '2026-11-01T00:00:00Z',
    };

    boardServiceSpy.createTask.and.returnValue(
      of({ success: true, message: 'Created', data: realCreatedTask, errors: [] })
    );

    service
      .createTaskOptimistically('col-1', {
        title: 'Real Task',
        priority: TaskPriority.Medium,
      })
      .subscribe((result) => {
        expect(result.id).toBe('task-real-99');
        const tasks = service.board()!.columns[0].tasks;
        expect(tasks.some((t) => t.id === 'task-real-99')).toBeTrue();
        expect(notificationServiceSpy.success).toHaveBeenCalled();
        done();
      });
  });

  it('should update task optimistically and sync with server', (done) => {
    const updatedTask: TaskItem = {
      ...initialTask,
      title: 'Updated Title',
    };

    boardServiceSpy.updateTask.and.returnValue(
      of({ success: true, message: 'Updated', data: updatedTask, errors: [] })
    );

    service
      .updateTaskOptimistically('task-1', {
        title: 'Updated Title',
        priority: TaskPriority.High,
      })
      .subscribe((result) => {
        expect(result.title).toBe('Updated Title');
        expect(service.board()!.columns[0].tasks[0].title).toBe('Updated Title');
        expect(notificationServiceSpy.success).toHaveBeenCalled();
        done();
      });
  });

  it('should delete task optimistically and remove from column', (done) => {
    boardServiceSpy.deleteTask.and.returnValue(
      of({ success: true, message: 'Deleted', data: void 0, errors: [] })
    );

    service.deleteTaskOptimistically('task-1').subscribe(() => {
      expect(service.board()!.columns[0].tasks.length).toBe(0);
      expect(notificationServiceSpy.success).toHaveBeenCalled();
      done();
    });
  });

  it('should clear all filters', () => {
    service.updateSearchTerm('sample');
    service.setPriorityFilter(TaskPriority.Urgent);
    service.setAssigneeFilter('user-1');

    service.clearFilters();

    expect(service.searchTerm()).toBe('');
    expect(service.priorityFilter()).toBeNull();
    expect(service.assigneeFilter()).toBeNull();
  });
});

