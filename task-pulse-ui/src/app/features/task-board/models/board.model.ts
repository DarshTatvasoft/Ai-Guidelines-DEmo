import { Column } from './column.model';

export interface BoardDetail {
  id: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  columns: Column[];
}

export interface BoardSummary {
  id: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  columnCount: number;
  taskCount: number;
  createdAt: string;
}

export interface CreateBoardRequest {
  title: string;
  description?: string | null;
}

