import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { User, TaskItem, TaskPriority } from '../models';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUsers: User[] = [
    { id: 'u1', fullName: 'Alice Smith', email: 'alice@example.com' },
    { id: 'u2', fullName: 'Bob Jones', email: 'bob@example.com' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all users via GET /api/v1/users', () => {
    service.getUsers().subscribe((res) => {
      expect(res.data.length).toBe(2);
      expect(res.data[0].fullName).toBe('Alice Smith');
    });

    const req = httpMock.expectOne('/api/v1/users');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'OK', data: mockUsers, errors: [] });
  });

  it('should assign a user via PATCH /api/v1/tasks/{taskId}/assign', () => {
    const taskId = 'task-100';
    const userId = 'u1';

    const mockUpdatedTask: TaskItem = {
      id: taskId,
      columnId: 'col-1',
      title: 'Implement Auth',
      position: 0,
      priority: TaskPriority.High,
      assigneeId: userId,
      assigneeName: 'Alice Smith',
      labels: [],
      createdAt: '2026-11-01T00:00:00Z',
    };

    service.assignTask(taskId, userId).subscribe((res) => {
      expect(res.data.assigneeId).toBe('u1');
      expect(res.data.assigneeName).toBe('Alice Smith');
    });

    const req = httpMock.expectOne(`/api/v1/tasks/${taskId}/assign`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ userId: 'u1' });
    req.flush({ success: true, message: 'Assigned', data: mockUpdatedTask, errors: [] });
  });

  it('should unassign a user with null userId', () => {
    const taskId = 'task-100';

    service.assignTask(taskId, null).subscribe((res) => {
      expect(res.data.assigneeId).toBeNull();
    });

    const req = httpMock.expectOne(`/api/v1/tasks/${taskId}/assign`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ userId: null });
    req.flush({
      success: true,
      message: 'Unassigned',
      data: {
        id: taskId,
        columnId: 'col-1',
        title: 'Task',
        position: 0,
        priority: TaskPriority.Medium,
        assigneeId: null,
        assigneeName: null,
        labels: [],
        createdAt: '2026-11-01T00:00:00Z',
      },
      errors: [],
    });
  });
});

