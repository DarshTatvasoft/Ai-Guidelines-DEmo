import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDropList,
  CdkDrag,
  CdkDragPlaceholder,
  CdkDragDrop,
} from '@angular/cdk/drag-drop';
import { TaskCardComponent } from '../task-card/task-card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { Column, TaskItem, User } from '../../models';

/**
 * BoardColumnComponent — Kanban workflow column managing task cards, WIP limits,
 * task counters, drag-and-drop ordering, and task creation actions.
 */
@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [
    CommonModule,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    TaskCardComponent,
    EmptyStateComponent,
  ],
  template: `
    <section
      class="board-column"
      [attr.aria-label]="column().title + ' Column'"
    >
      <!-- Column Header -->
      <header class="board-column__header">
        <div class="board-column__title-group">
          <span
            class="color-accent"
            [style.background-color]="column().colorHex"
            aria-hidden="true"
          ></span>
          <h3 class="board-column__title">{{ column().title }}</h3>
          <span
            class="count-badge"
            [class.count-badge--wip-exceeded]="isWipExceeded()"
            [class.count-badge--wip-warning]="isWipNearLimit()"
            [attr.title]="wipTitle()"
          >
            {{ taskCountDisplay() }}
          </span>
        </div>

        <button
          type="button"
          class="add-task-btn"
          [attr.aria-label]="'Add task to ' + column().title"
          (click)="addTask.emit(column().id)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </header>

      <!-- Task List Container (CDK Drop List) -->
      <div
        cdkDropList
        [id]="column().id"
        [cdkDropListData]="column().tasks"
        class="board-column__tasks"
        (cdkDropListDropped)="onDrop($event)"
      >
        @if (column().tasks.length === 0) {
          <div class="empty-dropzone">
            <app-empty-state
              [title]="'No tasks in ' + column().title"
              [description]="'Add a new task or move cards here.'"
            />
          </div>
        } @else {
          @for (task of column().tasks; track task.id) {
            <div
              cdkDrag
              [cdkDragData]="task"
              class="task-drag-wrapper"
            >
              <div *cdkDragPlaceholder class="task-drag-placeholder"></div>
              <app-task-card
                [task]="task"
                [users]="users()"
                [isAssigning]="assigningTaskId() === task.id"
                (taskClick)="taskClick.emit($event)"
                (edit)="editTask.emit($event)"
                (delete)="deleteTask.emit($event)"
                (assigneeChange)="assigneeChange.emit($event)"
              />
            </div>
          }
        }
      </div>
    </section>
  `,
  styleUrl: './board-column.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardColumnComponent {
  readonly column = input.required<Column>();
  readonly users = input<User[]>([]);
  readonly assigningTaskId = input<string | null>(null);

  readonly addTask = output<string>();
  readonly taskClick = output<TaskItem>();
  readonly editTask = output<TaskItem>();
  readonly deleteTask = output<TaskItem>();
  readonly assigneeChange = output<{ taskId: string; userId: string | null }>();
  readonly taskDrop = output<{
    task: TaskItem;
    sourceColumnId: string;
    targetColumnId: string;
    previousIndex: number;
    currentIndex: number;
  }>();

  protected readonly count = computed(() => this.column().tasks.length);

  protected readonly taskCountDisplay = computed(() => {
    const total = this.count();
    const limit = this.column().wipLimit;
    return limit ? `${total}/${limit}` : `${total}`;
  });

  protected readonly isWipExceeded = computed(() => {
    const limit = this.column().wipLimit;
    return !!limit && this.count() > limit;
  });

  protected readonly isWipNearLimit = computed(() => {
    const limit = this.column().wipLimit;
    return !!limit && this.count() === limit;
  });

  protected readonly wipTitle = computed(() => {
    const limit = this.column().wipLimit;
    if (!limit) return `${this.count()} tasks`;
    return `${this.count()} of ${limit} maximum tasks (WIP limit)`;
  });

  onDrop(event: CdkDragDrop<TaskItem[]>): void {
    const task = event.item.data as TaskItem;
    if (!task) return;

    const sourceColumnId = event.previousContainer.id;
    const targetColumnId = event.container.id;
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    if (sourceColumnId === targetColumnId && previousIndex === currentIndex) {
      return;
    }

    this.taskDrop.emit({
      task,
      sourceColumnId,
      targetColumnId,
      previousIndex,
      currentIndex,
    });
  }
}
