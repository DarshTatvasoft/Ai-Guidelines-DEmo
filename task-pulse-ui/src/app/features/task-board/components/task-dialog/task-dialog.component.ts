import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  effect,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import {
  Column,
  CreateTaskRequest,
  TaskItem,
  TaskPriority,
  UpdateTaskRequest,
  User,
} from '../../models';

/**
 * TaskDialogComponent — Strictly-typed reactive form modal for creating and editing tasks.
 */
@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AvatarComponent],
  template: `
    @if (isOpen()) {
      <div class="dialog-backdrop" (click)="onBackdropClick($event)">
        <div
          class="dialog-card"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="dialogTitleId"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="dialog-card__header">
            <h3 [id]="dialogTitleId" class="dialog-card__title">
              {{ isEditing() ? 'Edit Task' : 'Create New Task' }}
            </h3>
            <button
              type="button"
              class="close-btn"
              aria-label="Close dialog"
              [disabled]="isLoading()"
              (click)="cancel.emit()"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Form Body -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-card__body">
            <!-- Title Field -->
            <div class="form-group">
              <label for="task-title" class="form-label">
                Task Title <span class="required">*</span>
              </label>
              <input
                id="task-title"
                type="text"
                class="form-control"
                [class.form-control--error]="titleInvalid()"
                formControlName="title"
                placeholder="e.g. Implement JWT authentication"
              />
              @if (titleInvalid()) {
                <span class="error-msg">Title is required (1-200 characters).</span>
              }
            </div>

            <!-- Description Field -->
            <div class="form-group">
              <label for="task-desc" class="form-label">Description</label>
              <textarea
                id="task-desc"
                rows="3"
                class="form-control"
                formControlName="description"
                placeholder="Add context, acceptance criteria, or notes..."
              ></textarea>
            </div>

            <!-- Row: Column & Priority -->
            <div class="form-row">
              <div class="form-group">
                <label for="task-column" class="form-label">
                  Column <span class="required">*</span>
                </label>
                <select id="task-column" class="form-control" formControlName="columnId">
                  @for (col of columns(); track col.id) {
                    <option [value]="col.id">{{ col.title }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="task-priority" class="form-label">Priority</label>
                <select id="task-priority" class="form-control" formControlName="priority">
                  <option [value]="priorities.Low">Low</option>
                  <option [value]="priorities.Medium">Medium</option>
                  <option [value]="priorities.High">High</option>
                  <option [value]="priorities.Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <!-- Row: Due Date & Assignee with Avatar Preview -->
            <div class="form-row">
              <div class="form-group">
                <label for="task-due-date" class="form-label">Due Date</label>
                <input
                  id="task-due-date"
                  type="date"
                  class="form-control"
                  formControlName="dueDate"
                />
              </div>

              <div class="form-group">
                <label for="task-assignee" class="form-label">Assignee</label>
                <div class="assignee-input-group">
                  <div class="assignee-avatar-preview">
                    @if (selectedAssigneeUser()) {
                      <app-avatar
                        [name]="selectedAssigneeUser()!.fullName"
                        [size]="'sm'"
                        [src]="selectedAssigneeUser()!.avatarUrl ?? null"
                      />
                    } @else {
                      <div class="unassigned-avatar-placeholder" title="No assignee selected">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    }
                  </div>
                  <select id="task-assignee" class="form-control" formControlName="assigneeId">
                    <option value="">Unassigned</option>
                    @for (user of users(); track user.id) {
                      <option [value]="user.id">{{ user.fullName }} ({{ user.email }})</option>
                    }
                  </select>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="dialog-card__footer">
              <button
                type="button"
                class="btn btn--secondary"
                [disabled]="isLoading()"
                (click)="cancel.emit()"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn--primary"
                [disabled]="form.invalid || isLoading()"
              >
                @if (isLoading()) {
                  <span class="spinner-inline" aria-hidden="true"></span>
                }
                {{ isEditing() ? 'Save Changes' : 'Create Task' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styleUrl: './task-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly isOpen = input<boolean>(false);
  readonly task = input<TaskItem | null>(null);
  readonly columns = input<Column[]>([]);
  readonly users = input<User[]>([]);
  readonly defaultColumnId = input<string | null>(null);
  readonly isLoading = input<boolean>(false);

  readonly save = output<{
    task: CreateTaskRequest | UpdateTaskRequest;
    id?: string;
    columnId: string;
  }>();
  readonly cancel = output<void>();

  protected readonly priorities = TaskPriority;
  protected readonly dialogTitleId = 'task-dialog-' + Math.random().toString(36).substring(2, 9);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    columnId: ['', [Validators.required]],
    priority: [TaskPriority.Medium, [Validators.required]],
    dueDate: [''],
    assigneeId: [''],
  });

  protected readonly assigneeIdSignal = toSignal(this.form.controls.assigneeId.valueChanges, {
    initialValue: this.form.controls.assigneeId.value,
  });

  protected readonly selectedAssigneeUser = computed<User | null>(() => {
    const selectedId = this.assigneeIdSignal();
    if (!selectedId) return null;
    const found = this.users().find((u) => u.id.toLowerCase() === selectedId.toLowerCase());
    if (found) return found;
    const activeTask = this.task();
    if (activeTask && activeTask.assigneeId?.toLowerCase() === selectedId.toLowerCase()) {
      return activeTask.assignee ?? null;
    }
    return null;
  });

  constructor() {
    effect(() => {
      const activeTask = this.task();
      const defaultCol = this.defaultColumnId() || (this.columns()[0]?.id ?? '');

      if (activeTask) {
        this.form.patchValue({
          title: activeTask.title,
          description: activeTask.description ?? '',
          columnId: activeTask.columnId,
          priority: activeTask.priority,
          dueDate: activeTask.dueDate ? activeTask.dueDate.substring(0, 10) : '',
          assigneeId: activeTask.assigneeId ?? '',
        });
      } else {
        this.form.reset({
          title: '',
          description: '',
          columnId: defaultCol,
          priority: TaskPriority.Medium,
          dueDate: '',
          assigneeId: '',
        });
      }
    });
  }

  protected isEditing(): boolean {
    return !!this.task();
  }

  protected titleInvalid(): boolean {
    const control = this.form.controls.title;
    return control.invalid && (control.dirty || control.touched);
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (!this.isLoading()) {
      this.cancel.emit();
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const activeTask = this.task();

    const requestPayload: CreateTaskRequest = {
      title: raw.title.trim(),
      description: raw.description.trim() || null,
      priority: Number(raw.priority) as TaskPriority,
      dueDate: raw.dueDate ? new Date(raw.dueDate).toISOString() : null,
      assigneeId: raw.assigneeId.trim() || null,
    };

    this.save.emit({
      task: requestPayload,
      id: activeTask?.id,
      columnId: raw.columnId,
    });
  }
}

