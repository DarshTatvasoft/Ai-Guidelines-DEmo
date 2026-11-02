import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { BoardLayoutComponent } from '../../components/board-layout/board-layout.component';
import { BoardHeaderComponent } from '../../components/board-header/board-header.component';
import { BoardColumnComponent } from '../../components/board-column/board-column.component';
import { TaskDialogComponent } from '../../components/task-dialog/task-dialog.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { TaskStateService } from '../../services/task-state.service';
import { AuthService } from '../../../../core/services';
import {
  CreateTaskRequest,
  TaskItem,
  TaskPriority,
  UpdateTaskRequest,
} from '../../models';

/**
 * BoardPageComponent — Orchestrates the full Kanban workflow board,
 * reactive Signals state synchronization, drag-and-drop, and task lifecycle dialogs.
 */
@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [
    CommonModule,
    CdkDropListGroup,
    BoardLayoutComponent,
    BoardHeaderComponent,
    BoardColumnComponent,
    TaskDialogComponent,
    ConfirmModalComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <app-board-layout [user]="authService.currentUser()" (logout)="onLogout()">
      <!-- Top Bar Header Slot -->
      <app-board-header
        header
        [boardTitle]="boardTitle()"
        [totalTasks]="state.totalTaskCount()"
        [currentUser]="authService.currentUser()"
        [users]="state.users()"
        [searchTerm]="state.searchTerm()"
        [selectedPriority]="state.priorityFilter()"
        [selectedAssignee]="state.assigneeFilter()"
        (searchChange)="state.updateSearchTerm($event)"
        (priorityChange)="state.setPriorityFilter($event)"
        (assigneeChange)="state.setAssigneeFilter($event)"
        (createTask)="onOpenCreateDialog()"
        (logout)="onLogout()"
      />

      <!-- Kanban Columns Area -->
      @if (state.loading() && !state.board()) {
        <div class="board-loading">
          <app-loading-spinner [message]="'Loading Kanban Board...'" />
        </div>
      } @else if (!state.board() || state.board()!.columns.length === 0) {
        <div class="board-empty">
          <app-empty-state
            [title]="'No Kanban Columns Found'"
            [description]="'Create a new board or column to begin managing tasks.'"
          />
        </div>
      } @else {
        <div class="columns-grid" cdkDropListGroup>
          @for (column of state.filteredColumns(); track column.id) {
            <app-board-column
              [column]="column"
              [users]="state.users()"
              [assigningTaskId]="state.assigningTaskId()"
              (taskDrop)="onTaskDrop($event)"
              (addTask)="onOpenCreateDialog($event)"
              (editTask)="onOpenEditDialog($event)"
              (deleteTask)="onOpenDeleteConfirm($event)"
              (assigneeChange)="onAssigneeChange($event)"
            />
          }
        </div>
      }

      <!-- Task Create / Edit Dialog -->
      <app-task-dialog
        [isOpen]="dialogOpen()"
        [task]="editingTask()"
        [columns]="state.board()?.columns ?? []"
        [users]="state.users()"
        [defaultColumnId]="selectedColumnId()"
        [isLoading]="dialogSaving()"
        (save)="onSaveTask($event)"
        (cancel)="dialogOpen.set(false)"
      />

      <!-- Delete Confirmation Modal -->
      <app-confirm-modal
        [isOpen]="deleteModalOpen()"
        [title]="'Delete Task'"
        [message]="deleteMessage()"
        [confirmText]="'Delete'"
        [confirmVariant]="'danger'"
        [isLoading]="isDeleting()"
        (confirm)="onConfirmDelete()"
        (cancel)="deleteModalOpen.set(false)"
      />
    </app-board-layout>
  `,
  styles: [`
    .columns-grid {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-6);
      overflow-x: auto;
      padding-bottom: var(--spacing-6);
      min-height: calc(100vh - 200px);
      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar {
        height: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background-color: var(--color-gray-300);
        border-radius: var(--radius-full);
      }

      @media (min-width: 1024px) {
        gap: var(--spacing-6);
        padding-bottom: var(--spacing-8);
      }

      @media (max-width: 768px) {
        gap: var(--spacing-4);
        scroll-snap-type: x mandatory;
        scroll-padding: 0 var(--spacing-4);

        app-board-column {
          scroll-snap-align: start;
          scroll-snap-stop: always;
          flex-shrink: 0;
        }
      }

      @media (max-width: 480px) {
        gap: var(--spacing-3);
        scroll-padding: 0 var(--spacing-2);

        app-board-column {
          width: calc(100vw - 48px);
          max-width: calc(100vw - 48px);
        }
      }
    }

    .board-loading,
    .board-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    @media (prefers-reduced-motion: reduce) {
      .columns-grid {
        scroll-behavior: auto !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPageComponent implements OnInit {
  protected readonly state = inject(TaskStateService);
  protected readonly authService = inject(AuthService);

  // Dialog & Modal Signals
  protected readonly dialogOpen = signal<boolean>(false);
  protected readonly editingTask = signal<TaskItem | null>(null);
  protected readonly selectedColumnId = signal<string | null>(null);
  protected readonly dialogSaving = signal<boolean>(false);

  protected readonly deleteModalOpen = signal<boolean>(false);
  protected readonly taskToDelete = signal<TaskItem | null>(null);
  protected readonly isDeleting = signal<boolean>(false);

  ngOnInit(): void {
    this.state.loadBoard().subscribe();
    this.state.loadUsers().subscribe();
  }

  protected boardTitle(): string {
    return this.state.board()?.title ?? 'Task Board';
  }

  protected deleteMessage(): string {
    const task = this.taskToDelete();
    return task
      ? `Are you sure you want to permanently delete "${task.title}"?`
      : 'Are you sure you want to delete this task?';
  }

  protected onOpenCreateDialog(columnId?: string): void {
    this.editingTask.set(null);
    this.selectedColumnId.set(columnId ?? null);
    this.dialogOpen.set(true);
  }

  protected onOpenEditDialog(task: TaskItem): void {
    this.editingTask.set(task);
    this.selectedColumnId.set(task.columnId);
    this.dialogOpen.set(true);
  }

  protected onOpenDeleteConfirm(task: TaskItem): void {
    this.taskToDelete.set(task);
    this.deleteModalOpen.set(true);
  }

  protected onSaveTask(event: {
    task: CreateTaskRequest | UpdateTaskRequest;
    id?: string;
    columnId: string;
  }): void {
    this.dialogSaving.set(true);

    if (event.id) {
      this.state
        .updateTaskOptimistically(event.id, event.task as UpdateTaskRequest)
        .subscribe({
          next: () => {
            this.dialogSaving.set(false);
            this.dialogOpen.set(false);
          },
          error: () => this.dialogSaving.set(false),
        });
    } else {
      this.state
        .createTaskOptimistically(event.columnId, event.task as CreateTaskRequest)
        .subscribe({
          next: () => {
            this.dialogSaving.set(false);
            this.dialogOpen.set(false);
          },
          error: () => this.dialogSaving.set(false),
        });
    }
  }

  protected onConfirmDelete(): void {
    const task = this.taskToDelete();
    if (!task) return;

    this.isDeleting.set(true);
    this.state.deleteTaskOptimistically(task.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.deleteModalOpen.set(false);
        this.taskToDelete.set(null);
      },
      error: () => this.isDeleting.set(false),
    });
  }

  protected onAssigneeChange(event: { taskId: string; userId: string | null }): void {
    this.state.assignUserOptimistically(event.taskId, event.userId).subscribe();
  }

  protected onTaskDrop(event: {
    task: TaskItem;
    sourceColumnId: string;
    targetColumnId: string;
    previousIndex: number;
    currentIndex: number;
  }): void {
    this.state
      .moveTaskOptimistically(event.task.id, event.targetColumnId, event.currentIndex)
      .subscribe();
  }

  protected onLogout(): void {
    this.authService.logout();
  }
}
