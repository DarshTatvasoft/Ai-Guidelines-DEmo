import { Routes } from '@angular/router';

export const TASK_BOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/board-page/board-page.component').then(
        (m) => m.BoardPageComponent
      ),
  },
];

