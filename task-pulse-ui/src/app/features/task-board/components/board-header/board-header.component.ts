import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { TaskPriority, User } from '../../models';
import { UserProfile } from '../../../../core/models';

/**
 * BoardHeaderComponent — Top bar and filtering toolbar for Kanban task boards.
 * Provides live search, priority filters, assignee filtering, active user info,
 * logout button, and task creation trigger.
 */
@Component({
  selector: 'app-board-header',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <header class="board-header">
      <!-- Title & Metric Row -->
      <div class="board-header__top">
        <div class="board-header__meta">
          <h2 class="board-title">{{ boardTitle() }}</h2>
          <span class="tasks-count-pill" aria-label="Total tasks">
            {{ totalTasks() }} {{ totalTasks() === 1 ? 'task' : 'tasks' }}
          </span>
        </div>

        <div class="board-header__actions">
          @if (currentUser()) {
            <div class="user-profile-badge" [attr.aria-label]="'Logged in as ' + currentUser()!.fullName">
              <app-avatar
                [name]="currentUser()!.fullName"
                [size]="'sm'"
                [src]="currentUser()!.avatarUrl ?? null"
              />
              <span class="user-profile-badge__name">{{ currentUser()!.fullName }}</span>
            </div>

            <button
              type="button"
              class="btn-logout"
              aria-label="Logout"
              (click)="logout.emit()"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          }

          <button
            type="button"
            class="btn-create"
            aria-label="Create new task card"
            (click)="createTask.emit()"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Task</span>
          </button>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="board-header__filters">
        <!-- Search Input -->
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            class="search-input"
            placeholder="Search tasks..."
            [value]="searchTerm()"
            (input)="onSearchInput($event)"
            aria-label="Filter tasks by search term"
          />
        </div>

        <!-- Priority Filters Group -->
        <div class="priority-filters" role="group" aria-label="Filter by priority">
          <button
            type="button"
            class="filter-pill"
            [class.filter-pill--active]="selectedPriority() === null"
            (click)="priorityChange.emit(null)"
          >
            All
          </button>
          <button
            type="button"
            class="filter-pill filter-pill--low"
            [class.filter-pill--active]="selectedPriority() === priorities.Low"
            (click)="priorityChange.emit(priorities.Low)"
          >
            Low
          </button>
          <button
            type="button"
            class="filter-pill filter-pill--medium"
            [class.filter-pill--active]="selectedPriority() === priorities.Medium"
            (click)="priorityChange.emit(priorities.Medium)"
          >
            Medium
          </button>
          <button
            type="button"
            class="filter-pill filter-pill--high"
            [class.filter-pill--active]="selectedPriority() === priorities.High"
            (click)="priorityChange.emit(priorities.High)"
          >
            High
          </button>
          <button
            type="button"
            class="filter-pill filter-pill--urgent"
            [class.filter-pill--active]="selectedPriority() === priorities.Urgent"
            (click)="priorityChange.emit(priorities.Urgent)"
          >
            Urgent
          </button>
        </div>

        <!-- Assignee Filter Select -->
        <div class="assignee-filter">
          <label class="sr-only" for="assignee-filter-select">Filter by assignee</label>
          <select
            id="assignee-filter-select"
            class="filter-select"
            [value]="selectedAssignee() ?? ''"
            (change)="onAssigneeSelect($event)"
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            @for (user of users(); track user.id) {
              <option [value]="user.id">{{ user.fullName }}</option>
            }
          </select>
        </div>
      </div>
    </header>
  `,
  styleUrl: './board-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardHeaderComponent {
  readonly boardTitle = input<string>('Kanban Board');
  readonly totalTasks = input<number>(0);
  readonly currentUser = input<User | UserProfile | null>(null);
  readonly users = input<User[]>([]);
  readonly searchTerm = input<string>('');
  readonly selectedPriority = input<TaskPriority | null>(null);
  readonly selectedAssignee = input<string | null>(null);

  readonly searchChange = output<string>();
  readonly priorityChange = output<TaskPriority | null>();
  readonly assigneeChange = output<string | null>();
  readonly createTask = output<void>();
  readonly logout = output<void>();

  protected readonly priorities = TaskPriority;

  protected onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }

  protected onAssigneeSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value.trim();
    this.assigneeChange.emit(value.length > 0 ? value : null);
  }
}

