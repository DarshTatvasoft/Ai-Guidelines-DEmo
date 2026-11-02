import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent, BadgeVariant } from '../../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { TaskItem, TaskPriority, User } from '../../models';

/**
 * TaskCardComponent — Renders a single Kanban task card with priority badge, labels,
 * due date indicator, and interactive assignee avatar switcher.
 */
@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, BadgeComponent, AvatarComponent],
  template: `
    <article
      class="task-card"
      tabindex="0"
      [attr.aria-label]="'Task: ' + task().title"
      (click)="onCardClick($event)"
      (keydown.enter)="onCardClick($event)"
    >
      <!-- Card Header: Priority & Quick Actions -->
      <div class="task-card__header">
        <app-badge [variant]="priorityVariant()" [size]="'sm'" [dot]="true">
          {{ priorityLabel() }}
        </app-badge>

        <div class="task-card__actions" (click)="$event.stopPropagation()">
          <button
            type="button"
            class="action-btn"
            aria-label="Edit task"
            (click)="edit.emit(task())"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            class="action-btn action-btn--danger"
            aria-label="Delete task"
            (click)="delete.emit(task())"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Card Title -->
      <h4 class="task-card__title">{{ task().title }}</h4>

      <!-- Card Description (truncated) -->
      @if (task().description) {
        <p class="task-card__description">{{ task().description }}</p>
      }

      <!-- Tags / Labels -->
      @if (task().labels.length > 0) {
        <div class="task-card__labels">
          @for (label of task().labels; track label.id) {
            <app-badge [size]="'sm'" [colorHex]="label.colorHex">
              {{ label.name }}
            </app-badge>
          }
        </div>
      }

      <!-- Card Footer: Due Date & Assignee Switcher -->
      <div class="task-card__footer" (click)="$event.stopPropagation()">
        <div class="task-card__due-date">
          @if (task().dueDate) {
            <span class="due-pill" [class.due-pill--overdue]="isOverdue()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{{ formattedDueDate() }}</span>
            </span>
          }
        </div>

        <!-- Assignee Switcher -->
        <div class="assignee-wrapper" [title]="assigneeTooltip()">
          <label class="sr-only" [attr.for]="'assignee-' + task().id">Change Assignee</label>
          <div class="assignee-display">
            @if (task().assigneeId) {
              <app-avatar
                [name]="assigneeDisplayName()"
                [size]="'sm'"
                [src]="assigneeAvatarUrl()"
              />
            } @else {
              <div class="unassigned-avatar" title="Unassigned — Click to assign">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            }
          </div>

          <select
            [id]="'assignee-' + task().id"
            class="assignee-select"
            [disabled]="isAssigning()"
            [value]="task().assigneeId ?? ''"
            [attr.aria-label]="'Assignee: ' + assigneeDisplayName()"
            (change)="onAssigneeSelect($event)"
          >
            <option value="">Unassigned</option>
            @for (user of users(); track user.id) {
              <option [value]="user.id">{{ user.fullName }}</option>
            }
          </select>
        </div>
      </div>
    </article>
  `,
  styleUrl: './task-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  readonly task = input.required<TaskItem>();
  readonly users = input<User[]>([]);
  readonly isAssigning = input<boolean>(false);

  readonly taskClick = output<TaskItem>();
  readonly edit = output<TaskItem>();
  readonly delete = output<TaskItem>();
  readonly assigneeChange = output<{ taskId: string; userId: string | null }>();

  protected readonly priorityVariant = computed<BadgeVariant>(() => {
    switch (this.task().priority) {
      case TaskPriority.Low:
        return 'priority-low';
      case TaskPriority.Medium:
        return 'priority-medium';
      case TaskPriority.High:
        return 'priority-high';
      case TaskPriority.Urgent:
        return 'priority-urgent';
      default:
        return 'default';
    }
  });

  protected readonly priorityLabel = computed<string>(() => {
    switch (this.task().priority) {
      case TaskPriority.Low:
        return 'Low';
      case TaskPriority.Medium:
        return 'Medium';
      case TaskPriority.High:
        return 'High';
      case TaskPriority.Urgent:
        return 'Urgent';
      default:
        return 'Normal';
    }
  });

  protected readonly formattedDueDate = computed<string>(() => {
    const raw = this.task().dueDate;
    if (!raw) return '';
    const date = new Date(raw);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });

  protected readonly isOverdue = computed<boolean>(() => {
    const raw = this.task().dueDate;
    if (!raw) return false;
    return new Date(raw).getTime() < Date.now();
  });

  protected readonly assignedUser = computed<User | null>(() => {
    const aid = this.task().assigneeId;
    if (!aid) return null;
    return this.users().find((u) => u.id.toLowerCase() === aid.toLowerCase()) ?? this.task().assignee ?? null;
  });

  protected readonly assigneeDisplayName = computed<string>(() => {
    const user = this.assignedUser();
    if (user?.fullName) return user.fullName;
    const name = this.task().assigneeName;
    if (name) return name;
    return 'Unassigned';
  });

  protected readonly assigneeAvatarUrl = computed<string | null>(() => {
    return this.assignedUser()?.avatarUrl ?? this.task().assignee?.avatarUrl ?? null;
  });

  protected readonly assigneeTooltip = computed<string>(() => {
    const name = this.assigneeDisplayName();
    return name === 'Unassigned' ? 'Click to assign user' : `Assigned to ${name} (click to change)`;
  });

  protected onCardClick(event: Event): void {
    this.taskClick.emit(this.task());
  }

  protected onAssigneeSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value.trim();
    const userId = value.length > 0 ? value : null;
    this.assigneeChange.emit({ taskId: this.task().id, userId });
  }
}

