import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BoardService } from './board.service';
import { UserService } from './user.service';

describe('BoardService', () => {
  let service: BoardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BoardService, UserService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BoardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch boards list', () => {
    service.getBoards().subscribe((res) => {
      expect(res.data.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/v1/boards');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'OK', data: [{ id: 'b1', title: 'Main' }], errors: [] });
  });

  it('should delegate user assignment to UserService', () => {
    service.assignTask('t1', 'u1').subscribe();

    const req = httpMock.expectOne('/api/v1/tasks/t1/assign');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ userId: 'u1' });
    req.flush({ success: true, message: 'OK', data: {}, errors: [] });
  });

  it('should get board by id', () => {
    service.getBoardById('b-1').subscribe((res) => {
      expect(res.data.id).toBe('b-1');
    });

    const req = httpMock.expectOne('/api/v1/boards/b-1');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'OK', data: { id: 'b-1', title: 'Main' }, errors: [] });
  });

  it('should create board', () => {
    service.createBoard({ title: 'New Board' }).subscribe();

    const req = httpMock.expectOne('/api/v1/boards');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'New Board' });
    req.flush({ success: true, message: 'OK', data: {}, errors: [] });
  });

  it('should create column', () => {
    service.createColumn('b-1', { title: 'Backlog' }).subscribe();

    const req = httpMock.expectOne('/api/v1/boards/b-1/columns');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: {}, errors: [] });
  });

  it('should update column', () => {
    service.updateColumn('col-1', { title: 'Updated', colorHex: '#10B981' }).subscribe();

    const req = httpMock.expectOne('/api/v1/columns/col-1');
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, message: 'OK', data: {}, errors: [] });
  });

  it('should delete column', () => {
    service.deleteColumn('col-1').subscribe();

    const req = httpMock.expectOne('/api/v1/columns/col-1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK', data: null, errors: [] });
  });

  it('should create, update, move, and delete task', () => {
    // create task
    service.createTask('col-1', { title: 'Task' }).subscribe();
    const reqCreate = httpMock.expectOne('/api/v1/columns/col-1/tasks');
    expect(reqCreate.request.method).toBe('POST');
    reqCreate.flush({ success: true, message: 'OK', data: {}, errors: [] });

    // update task
    service.updateTask('t-1', { title: 'Updated', priority: 2 }).subscribe();
    const reqUpdate = httpMock.expectOne('/api/v1/tasks/t-1');
    expect(reqUpdate.request.method).toBe('PUT');
    reqUpdate.flush({ success: true, message: 'OK', data: {}, errors: [] });

    // move task
    service.moveTask('t-1', { targetColumnId: 'col-2', newPosition: 1 }).subscribe();
    const reqMove = httpMock.expectOne('/api/v1/tasks/t-1/move');
    expect(reqMove.request.method).toBe('PATCH');
    reqMove.flush({ success: true, message: 'OK', data: {}, errors: [] });

    // delete task
    service.deleteTask('t-1').subscribe();
    const reqDelete = httpMock.expectOne('/api/v1/tasks/t-1');
    expect(reqDelete.request.method).toBe('DELETE');
    reqDelete.flush({ success: true, message: 'OK', data: null, errors: [] });
  });

  it('should delegate getUsers to UserService', () => {
    service.getUsers().subscribe((res) => {
      expect(res.data.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/v1/users');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'OK', data: [{ id: 'u1', fullName: 'User 1' }], errors: [] });
  });
});

