import { Routes } from '@angular/router';

export const leadRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: {
      breadcrumb: 'LEADS.LIST_BREADCRUMB',
      titleKey: 'LEADS.LIST_TITLE',
      subtitleKey: 'LEADS.LIST_SUBTITLE',
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

