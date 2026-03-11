import { Routes } from '@angular/router';
import { guestGuard } from '../../core/auth/guards/guest.guard';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.LoginPage),
  },
];
