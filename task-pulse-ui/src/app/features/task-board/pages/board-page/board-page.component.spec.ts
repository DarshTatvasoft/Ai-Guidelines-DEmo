import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BoardPageComponent } from './board-page.component';
import { TaskStateService } from '../../services/task-state.service';
import { AuthService } from '../../../../core/services';
import { BoardDetail, TaskPriority } from '../../models';

describe('BoardPageComponent', () => {
  let component: BoardPageComponent;
  let fixture: ComponentFixture<BoardPageComponent>;
  let stateSpy: jasmine.SpyObj<TaskStateService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  const mockBoard: BoardDetail = {
    id: 'b-1',
    title: 'Sprint Board',
    isActive: true,
    createdAt: '2026-11-01T00:00:00Z',
    columns: [
      {
        id: 'c-1',
        boardId: 'b-1',
        title: 'To Do',
        position: 0,
        colorHex: '#6366F1',
        tasks: [
          {
            id: 't-1',
            columnId: 'c-1',
            title: 'Initial Task',
            position: 0,
            priority: TaskPriority.Medium,
            labels: [],
            createdAt: '2026-11-01T00:00:00Z',
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    stateSpy = jasmine.createSpyObj('TaskStateService', [
      'loadBoard',
      'loadUsers',
      'updateSearchTerm',
      'setPriorityFilter',
      'setAssigneeFilter',
      'createTaskOptimistically',
      'updateTaskOptimistically',
      'deleteTaskOptimistically',
      'assignUserOptimistically',
      'moveTaskOptimistically',
    ], {
      board: () => mockBoard,
      users: () => [],
      searchTerm: () => '',
      priorityFilter: () => null,
      assigneeFilter: () => null,
      loading: () => false,
      assigningTaskId: () => null,
      totalTaskCount: () => 1,
      filteredColumns: () => mockBoard.columns,
    });

    stateSpy.loadBoard.and.returnValue(of(mockBoard));
    stateSpy.loadUsers.and.returnValue(of([]));
    stateSpy.moveTaskOptimistically.and.returnValue(of(mockBoard.columns[0].tasks[0]));

    authSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser: () => null,
    });

    await TestBed.configureTestingModule({
      imports: [BoardPageComponent],
      providers: [
        { provide: TaskStateService, useValue: stateSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load board on init', () => {
    expect(component).toBeTruthy();
    expect(stateSpy.loadBoard).toHaveBeenCalled();
    expect(stateSpy.loadUsers).toHaveBeenCalled();
  });

  it('should render columns in grid', () => {
    const columns = fixture.nativeElement.querySelectorAll('app-board-column');
    expect(columns.length).toBe(1);
  });

  it('should call state.moveTaskOptimistically when a task is dropped', () => {
    const dropEvent = {
      task: mockBoard.columns[0].tasks[0],
      sourceColumnId: 'c-1',
      targetColumnId: 'c-2',
      previousIndex: 0,
      currentIndex: 2,
    };

    (component as any).onTaskDrop(dropEvent);

    expect(stateSpy.moveTaskOptimistically).toHaveBeenCalledWith('t-1', 'c-2', 2);
  });

  it('should open create dialog when onOpenCreateDialog is called', () => {
    (component as any).onOpenCreateDialog('c-1');
    expect((component as any).dialogOpen()).toBeTrue();
    expect((component as any).selectedColumnId()).toBe('c-1');
    expect((component as any).editingTask()).toBeNull();
  });

  it('should open edit dialog when onOpenEditDialog is called', () => {
    const task = mockBoard.columns[0].tasks[0];
    (component as any).onOpenEditDialog(task);
    expect((component as any).dialogOpen()).toBeTrue();
    expect((component as any).selectedColumnId()).toBe('c-1');
    expect((component as any).editingTask()).toEqual(task);
  });

  it('should open delete confirm modal when onOpenDeleteConfirm is called', () => {
    const task = mockBoard.columns[0].tasks[0];
    (component as any).onOpenDeleteConfirm(task);
    expect((component as any).deleteModalOpen()).toBeTrue();
    expect((component as any).taskToDelete()).toEqual(task);
    expect((component as any).deleteMessage()).toContain('Initial Task');
  });

  it('should call createTaskOptimistically on save with new task', () => {
    stateSpy.createTaskOptimistically.and.returnValue(of(mockBoard.columns[0].tasks[0]));

    (component as any).onSaveTask({
      task: { title: 'New Task', priority: TaskPriority.Low },
      columnId: 'c-1',
    });

    expect(stateSpy.createTaskOptimistically).toHaveBeenCalled();
    expect((component as any).dialogOpen()).toBeFalse();
  });

  it('should call updateTaskOptimistically on save with existing task', () => {
    stateSpy.updateTaskOptimistically.and.returnValue(of(mockBoard.columns[0].tasks[0]));

    (component as any).onSaveTask({
      id: 't-1',
      task: { title: 'Updated Task', priority: TaskPriority.High },
      columnId: 'c-1',
    });

    expect(stateSpy.updateTaskOptimistically).toHaveBeenCalledWith('t-1', {
      title: 'Updated Task',
      priority: TaskPriority.High,
    });
    expect((component as any).dialogOpen()).toBeFalse();
  });

  it('should call deleteTaskOptimistically on confirm delete', () => {
    stateSpy.deleteTaskOptimistically.and.returnValue(of(void 0));
    (component as any).taskToDelete.set(mockBoard.columns[0].tasks[0]);

    (component as any).onConfirmDelete();

    expect(stateSpy.deleteTaskOptimistically).toHaveBeenCalledWith('t-1');
    expect((component as any).deleteModalOpen()).toBeFalse();
  });

  it('should call assignUserOptimistically when onAssigneeChange is invoked', () => {
    stateSpy.assignUserOptimistically.and.returnValue(of(mockBoard.columns[0].tasks[0]));

    (component as any).onAssigneeChange({ taskId: 't-1', userId: 'user-1' });

    expect(stateSpy.assignUserOptimistically).toHaveBeenCalledWith('t-1', 'user-1');
  });

  it('should call authService.logout when onLogout is called', () => {
    (component as any).onLogout();
    expect(authSpy.logout).toHaveBeenCalled();
  });
});
