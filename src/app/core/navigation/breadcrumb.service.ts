import { computed, Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export interface Breadcrumb {
  label: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private router = inject(Router);
  private readonly labelOverrides = signal<Record<string, string>>({});
  private readonly navigationTick = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly breadcrumbs = computed(() => {
    this.navigationTick();
    this.labelOverrides();
    return this.buildBreadcrumbs(this.router.routerState.snapshot.root);
  });

  setLabel(path: string, label: string): void {
    const next = label.trim();
    if (!next) return;

    this.labelOverrides.update(current => ({
      ...current,
      [path]: next,
    }));
  }

  clearLabel(path: string): void {
    this.labelOverrides.update(current => {
      const next = { ...current };
      delete next[path];
      return next;
    });
  }

  private buildBreadcrumbs(
    route: ActivatedRouteSnapshot | null,
    url = '',
    crumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    if (!route) return crumbs;

    const segments = route.url.map(s => s.path);

    if (segments.length) {
      const path = `${url}/${segments.join('/')}`;
      const label = this.labelOverrides()[path] ?? route.data?.['breadcrumb'];
      if (label) crumbs.push({ label, path });
      return this.buildBreadcrumbs(route.firstChild, path, crumbs);
    }

    // Empty-path route (layout wrapper): skip segment but keep traversing
    return this.buildBreadcrumbs(route.firstChild, url, crumbs);
  }
}
