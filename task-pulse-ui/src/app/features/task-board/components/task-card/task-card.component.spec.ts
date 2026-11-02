import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { TaskItem, TaskPriority } from '../../models';

describe('TaskCardComponent', () => {
  let component: TaskCardComponent;
  let fixture: ComponentFixture<TaskCardComponent>;

  const mockTask: TaskItem = {
    id: 'task-101',
    columnId: 'col-1',
    title: 'Setup Database Migrations',
    description: 'Create initial EF Core migration',
    position: 0,
    priority: TaskPriority.Urgent,
    dueDate: '2026-11-15T00:00:00Z',
    assigneeId: 'user-1',
    assigneeName: 'Alice Smith',
    labels: [{ id: 'l1', name: 'Backend', colorHex: '#4F46E5' }],
    createdAt: '2026-11-01T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('task', mockTask);
    fixture.detectChanges();
  });

  it('should render card title and description', () => {
    const titleEl = fixture.nativeElement.querySelector('.task-card__title');
    expect(titleEl.textContent.trim()).toBe('Setup Database Migrations');

    const descEl = fixture.nativeElement.querySelector('.task-card__description');
    expect(descEl.textContent.trim()).toBe('Create initial EF Core migration');
  });

  it('should emit edit and delete events when action buttons are clicked', () => {
    let editedTask: TaskItem | null = null;
    let deletedTask: TaskItem | null = null;

    component.edit.subscribe((t: TaskItem) => (editedTask = t));
    component.delete.subscribe((t: TaskItem) => (deletedTask = t));

    const editBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Edit task"]');
    editBtn.click();
    expect(editedTask as TaskItem | null).toEqual(mockTask);

    const deleteBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Delete task"]');
    deleteBtn.click();
    expect(deletedTask as TaskItem | null).toEqual(mockTask);
  });

  it('should emit assigneeChange when select option changes', () => {
    fixture.componentRef.setInput('users', [
      { id: 'user-2', fullName: 'Bob Jones', email: 'bob@example.com' },
    ]);
    fixture.detectChanges();

    let changedPayload: { taskId: string; userId: string | null } | null = null;
    component.assigneeChange.subscribe((p: { taskId: string; userId: string | null }) => (changedPayload = p));

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('.assignee-select');
    select.value = 'user-2';
    select.dispatchEvent(new Event('change'));

    expect(changedPayload as { taskId: string; userId: string | null } | null).toEqual({
      taskId: 'task-101',
      userId: 'user-2',
    });
  });

  it('should render app-avatar with assignee name and initials when assigned', () => {
    fixture.componentRef.setInput('users', [
      { id: 'user-1', fullName: 'Alice Smith', email: 'alice@example.com' },
    ]);
    fixture.detectChanges();

    const avatarEl = fixture.nativeElement.querySelector('app-avatar');
    expect(avatarEl).toBeTruthy();
    expect(avatarEl.textContent.trim()).toBe('AS');
  });

  it('should render unassigned icon when task has no assignee', () => {
    fixture.componentRef.setInput('task', {
      ...mockTask,
      assigneeId: null,
      assigneeName: null,
    });
    fixture.detectChanges();

    const unassignedEl = fixture.nativeElement.querySelector('.unassigned-avatar');
    expect(unassignedEl).toBeTruthy();
    const avatarEl = fixture.nativeElement.querySelector('app-avatar');
    expect(avatarEl).toBeFalsy();
  });
});
