import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardHeaderComponent } from './board-header.component';
import { TaskPriority } from '../../models';

describe('BoardHeaderComponent', () => {
  let component: BoardHeaderComponent;
  let fixture: ComponentFixture<BoardHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('boardTitle', 'Sprint 42');
    fixture.componentRef.setInput('totalTasks', 14);
    fixture.detectChanges();
  });

  it('should render board title and total task badge', () => {
    const titleEl = fixture.nativeElement.querySelector('.board-title');
    expect(titleEl.textContent.trim()).toBe('Sprint 42');

    const countEl = fixture.nativeElement.querySelector('.tasks-count-pill');
    expect(countEl.textContent.trim()).toBe('14 tasks');
  });

  it('should emit createTask when New Task button is clicked', () => {
    let triggered = false;
    component.createTask.subscribe(() => (triggered = true));

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-create');
    btn.click();

    expect(triggered).toBeTrue();
  });

  it('should emit searchChange on text input', () => {
    let term = '';
    component.searchChange.subscribe((v) => (term = v));

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.search-input');
    input.value = 'refactor';
    input.dispatchEvent(new Event('input'));

    expect(term).toBe('refactor');
  });

  it('should emit priorityChange when priority pill is clicked', () => {
    let priority: TaskPriority | null = null;
    component.priorityChange.subscribe((p: TaskPriority | null) => (priority = p));

    const urgentBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.filter-pill--urgent');
    urgentBtn.click();

    expect(priority as TaskPriority | null).toBe(TaskPriority.Urgent);
  });

  it('should display current user avatar, name, and emit logout on click', () => {
    fixture.componentRef.setInput('currentUser', {
      id: 'u-1',
      fullName: 'Darsh Aswani',
      email: 'darsh@example.com',
    });
    fixture.detectChanges();

    const nameEl = fixture.nativeElement.querySelector('.user-profile-badge__name');
    expect(nameEl).toBeTruthy();
    expect(nameEl.textContent.trim()).toBe('Darsh Aswani');

    const avatarEl = fixture.nativeElement.querySelector('.user-profile-badge app-avatar');
    expect(avatarEl).toBeTruthy();
    expect(avatarEl.textContent.trim()).toBe('DA');

    let loggedOut = false;
    component.logout.subscribe(() => (loggedOut = true));

    const logoutBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-logout');
    expect(logoutBtn).toBeTruthy();
    logoutBtn.click();

    expect(loggedOut).toBeTrue();
  });
});
