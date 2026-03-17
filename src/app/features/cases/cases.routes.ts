import { Routes } from '@angular/router';

export const casesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/case-list/case-list').then(m => m.CaseListPage),
  },
  {
    path: ':id',
    data: { breadcrumb: 'Expediente' },
    loadComponent: () =>
      import('./pages/case-detail/case-detail').then(m => m.CaseDetailPage),
  },
];
