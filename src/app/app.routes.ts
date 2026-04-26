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
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/pages/reset-password/reset-password').then(m => m.ResetPasswordPage),
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
      {
        path: 'users',
        data: { breadcrumb: 'USERS.BREADCRUMB' },
        loadChildren: () =>
          import('./features/users/users.routes').then(m => m.usersRoutes),
      },
      {
        path: 'leads',
        data: { breadcrumb: 'LEADS.BREADCRUMB' },
        loadChildren: () =>
          import('./features/lead/lead.routes').then(m => m.leadRoutes),
      },
      {
        path: 'settings',
        data: { breadcrumb: 'SETTINGS.BREADCRUMB' },
        children: [
          {
            path: 'catalogs',
            data: { breadcrumb: 'CATALOGS.BREADCRUMB', titleKey: 'CATALOGS.TITLE', subtitleKey: 'CATALOGS.SUBTITLE' },
            loadComponent: () =>
              import('./features/settings/pages/catalog-list/catalog-list').then(m => m.CatalogListPage),
          },
          {
            path: 'access',
            data: { breadcrumb: 'ROLE_ACCESS.BREADCRUMB', titleKey: 'ROLE_ACCESS.TITLE', subtitleKey: 'ROLE_ACCESS.SUBTITLE' },
            loadComponent: () =>
              import('./features/settings/pages/role-access/role-access').then(m => m.RoleAccessPage),
          },
          {
            path: 'nav-items',
            data: { breadcrumb: 'NAV_ITEM_CONFIG.BREADCRUMB', titleKey: 'NAV_ITEM_CONFIG.TITLE', subtitleKey: 'NAV_ITEM_CONFIG.SUBTITLE' },
            loadComponent: () =>
              import('./features/settings/pages/nav-items/nav-items').then(m => m.NavItemsPage),
          },
          {
            path: 'sessions',
            data: { breadcrumb: 'AUTH_SESSIONS.BREADCRUMB', titleKey: 'AUTH_SESSIONS.TITLE', subtitleKey: 'AUTH_SESSIONS.SUBTITLE' },
            loadComponent: () =>
              import('./features/settings/pages/auth-sessions/auth-sessions').then(m => m.AuthSessionsPage),
          },
          {
            path: 'lead-import-operations',
            data: { breadcrumb: 'LEAD_IMPORT_OPERATIONS.BREADCRUMB', titleKey: 'LEAD_IMPORT_OPERATIONS.TITLE', subtitleKey: 'LEAD_IMPORT_OPERATIONS.SUBTITLE' },
            loadComponent: () =>
              import('./features/settings/pages/lead-bulk-import-operations/lead-bulk-import-operations').then(m => m.LeadBulkImportOperationsPage),
          },
        ],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
