import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export interface Breadcrumb {
  label: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly breadcrumbs = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.buildBreadcrumbs(this.route.root))
    ),
    { initialValue: [] as Breadcrumb[] }
  );

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url = '',
    crumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    const children = route.children;

    for (const child of children) {
      const segments = child.snapshot.url.map(s => s.path);
      if (!segments.length) {
        return this.buildBreadcrumbs(child, url, crumbs);
      }

      const path = `${url}/${segments.join('/')}`;
      const label = child.snapshot.data?.['breadcrumb'];

      if (label) {
        crumbs.push({ label, path });
      }

      return this.buildBreadcrumbs(child, path, crumbs);
    }

    return crumbs;
  }
}
