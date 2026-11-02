import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created with empty notification list', () => {
    expect(service).toBeTruthy();
    expect(service.notifications().length).toBe(0);
  });

  it('should add notifications with correct types and messages', () => {
    service.success('Operation succeeded', 'Done');
    service.error('Operation failed', 'Oops');
    service.warning('Take care', 'Caution');
    service.info('FYI', 'Note');

    const list = service.notifications();
    expect(list.length).toBe(4);
    expect(list[0].type).toBe('success');
    expect(list[0].message).toBe('Operation succeeded');
    expect(list[1].type).toBe('error');
    expect(list[2].type).toBe('warning');
    expect(list[3].type).toBe('info');
  });

  it('should dismiss specific notification by id', () => {
    const id1 = service.success('First');
    const id2 = service.error('Second');

    expect(service.notifications().length).toBe(2);

    service.dismiss(id1);

    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].id).toBe(id2);
  });

  it('should clear all notifications', () => {
    service.success('First');
    service.error('Second');
    expect(service.notifications().length).toBe(2);

    service.clear();
    expect(service.notifications().length).toBe(0);
  });

  it('should automatically dismiss after specified timeout', fakeAsync(() => {
    service.show('info', 'Auto dismiss test', 'Auto', 3000);
    expect(service.notifications().length).toBe(1);

    tick(3001);
    expect(service.notifications().length).toBe(0);
  }));
});

