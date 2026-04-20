import { Routes } from '@angular/router';

export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/user-list/user-list').then(m => m.UserListPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/user-detail/user-detail').then(m => m.UserDetailPage),
  },
];
