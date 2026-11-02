import { Routes } from '@angular/router';
import { authGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/pages/landing-page/landing-page.component').then(
        (m) => m.LandingPageComponent
      ),
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'board',
    redirectTo: 'boards',
    pathMatch: 'full',
  },
  {
    path: 'boards',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/task-board/task-board.routes').then(
        (m) => m.TASK_BOARD_ROUTES
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
