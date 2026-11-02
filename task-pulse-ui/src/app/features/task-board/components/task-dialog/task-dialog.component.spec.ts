import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskDialogComponent } from './task-dialog.component';
import { TaskPriority } from '../../models';

describe('TaskDialogComponent', () => {
  let component: TaskDialogComponent;
  let fixture: ComponentFixture<TaskDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('columns', [
      { id: 'c1', title: 'To Do', boardId: 'b1', position: 0, colorHex: '#fff', tasks: [] },
    ]);
    fixture.detectChanges();
  });

  it('should initialize form with empty values for new task', () => {
    expect(component.form.valid).toBeFalse();
    expect(component.form.controls.title.value).toBe('');
  });

  it('should emit save event with typed request when valid form is submitted', () => {
    let emittedData: any = null;
    component.save.subscribe((data) => (emittedData = data));

    component.form.patchValue({
      title: 'Setup Clean Architecture',
      description: 'Implement domain models',
      columnId: 'c1',
      priority: TaskPriority.High,
      dueDate: '2026-11-20',
      assigneeId: '',
    });
    fixture.detectChanges();

    expect(component.form.valid).toBeTrue();

    const formEl = fixture.nativeElement.querySelector('form');
    formEl.dispatchEvent(new Event('submit'));

    expect(emittedData).toBeTruthy();
    expect(emittedData.task.title).toBe('Setup Clean Architecture');
    expect(emittedData.task.priority).toBe(TaskPriority.High);
    expect(emittedData.columnId).toBe('c1');
  });

  it('should populate form when task input is provided for editing', () => {
    fixture.componentRef.setInput('task', {
      id: 't-99',
      columnId: 'c1',
      title: 'Existing Task',
      description: 'Existing Description',
      position: 0,
      priority: TaskPriority.Urgent,
      labels: [],
      createdAt: '2026-11-01T00:00:00Z',
    });
    fixture.detectChanges();

    expect(component.form.controls.title.value).toBe('Existing Task');
    expect(component.form.controls.priority.value).toBe(TaskPriority.Urgent);
  });

  it('should render unassigned avatar placeholder when no user is selected', () => {
    const placeholder = fixture.nativeElement.querySelector('.unassigned-avatar-placeholder');
    expect(placeholder).toBeTruthy();
    const avatar = fixture.nativeElement.querySelector('.assignee-avatar-preview app-avatar');
    expect(avatar).toBeFalsy();
  });

  it('should render app-avatar when user assignee is selected in dialog', () => {
    fixture.componentRef.setInput('users', [
      { id: 'u-1', fullName: 'Sarah Connor', email: 'sarah@example.com' },
    ]);
    fixture.detectChanges();

    component.form.controls.assigneeId.setValue('u-1');
    fixture.detectChanges();

    const avatar = fixture.nativeElement.querySelector('.assignee-avatar-preview app-avatar');
    expect(avatar).toBeTruthy();
    expect(avatar.textContent.trim()).toBe('SC');
  });
});

