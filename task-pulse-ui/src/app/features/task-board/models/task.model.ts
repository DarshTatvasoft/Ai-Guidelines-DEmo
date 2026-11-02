import { User } from './user.model';

export enum TaskPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Urgent = 4,
}

export interface Label {
  id: string;
  name: string;
  colorHex: string;
}

export interface TaskItem {
  id: string;
  columnId: string;
  title: string;
  description?: string | null;
  position: number;
  priority: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assignee?: User | null;
  labels: Label[];
  createdAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
  labelIds?: string[] | null;
}

export interface UpdateTaskRequest {
  title: string;
  description?: string | null;
  priority: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
  labelIds?: string[] | null;
}

export interface MoveTaskRequest {
  targetColumnId: string;
  newPosition: number;
}

