import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { guestGuard } from './core/auth/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout').then(m => m.AuthLayout),
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadChildren: () =>
          import('./features/auth/auth.routes').then(m => m.authRoutes),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/app-layout/app-layout').then(m => m.AppLayout),
    children: [
      {
        path: 'dashboard',
        data: { breadcrumb: 'Dashboard' },
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then(m => m.DashboardPage),
      },
      {
        path: 'calendar',
        data: { breadcrumb: 'Calendario' },
        loadChildren: () =>
          import('./features/calendar/calendar.routes').then(m => m.calendarRoutes),
      },
      {
        path: 'cases',
        data: { breadcrumb: 'Expedientes' },
        loadChildren: () =>
          import('./features/cases/cases.routes').then(m => m.casesRoutes),
      },
      {
        path: 'profile',
        data: { breadcrumb: 'PROFILE.BREADCRUMB' },
        loadChildren: () =>
          import('./features/profile/profile.routes').then(m => m.profileRoutes),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
