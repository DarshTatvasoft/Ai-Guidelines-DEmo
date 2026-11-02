import { TaskItem } from './task.model';

export interface Column {
  id: string;
  boardId: string;
  title: string;
  position: number;
  colorHex: string;
  wipLimit?: number | null;
  tasks: TaskItem[];
}

export interface CreateColumnRequest {
  title: string;
  colorHex?: string;
  wipLimit?: number | null;
}

export interface UpdateColumnRequest {
  title: string;
  colorHex: string;
  wipLimit?: number | null;
}

