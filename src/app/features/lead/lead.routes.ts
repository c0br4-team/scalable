import { Routes } from '@angular/router';

export const leadRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'imported',
  },
  {
    path: 'imported',
    data: {
      breadcrumb: 'LEADS.IMPORTED_BREADCRUMB',
      source: 'sheet',
      titleKey: 'LEADS.IMPORTED_TITLE',
      subtitleKey: 'LEADS.IMPORTED_SUBTITLE',
    },
    loadComponent: () =>
      import('./pages/lead-list/lead-list.component').then(m => m.LeadListComponent),
  },
  {
    path: 'manual',
    data: {
      breadcrumb: 'LEADS.MANUAL_BREADCRUMB',
      source: 'manual',
      titleKey: 'LEADS.MANUAL_TITLE',
      subtitleKey: 'LEADS.MANUAL_SUBTITLE',
    },
    loadComponent: () =>
      import('./pages/lead-list/lead-list.component').then(m => m.LeadListComponent),
  },
  {
    path: 'new',
    data: { breadcrumb: 'LEADS.NEW_LEAD' },
    loadComponent: () =>
      import('./pages/create-lead/create-lead.component').then(m => m.CreateLeadComponent),
  },
  {
    path: ':leadRef',
    data: { breadcrumb: 'LEADS.DETAIL_LEAD' },
    loadComponent: () =>
      import('./pages/lead-detail/lead-detail').then(m => m.LeadDetailPage),
  },
];

