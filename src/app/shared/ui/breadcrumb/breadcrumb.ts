import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink, NgIcon, TranslatePipe],
  template: `
    @if (breadcrumbService.breadcrumbs().length) {
      <!-- Mobile: solo título de la página actual -->
      <span class="sm:hidden text-sm font-semibold text-gray-800 truncate max-w-[160px]">
        {{ last().label | translate }}
      </span>

      <!-- Desktop: trail completo -->
      <nav class="hidden sm:flex items-center gap-1 text-sm text-gray-500">
        <a routerLink="/dashboard" class="hover:text-[#1e3a5f] transition-colors">{{ 'HEADER.HOME' | translate }}</a>
        @for (crumb of breadcrumbService.breadcrumbs(); track crumb.path; let last = $last) {
          <ng-icon name="heroChevronRight" class="text-sm shrink-0" />
          @if (last) {
            <span class="text-gray-800 font-medium">{{ crumb.label | translate }}</span>
          } @else {
            <a [routerLink]="crumb.path" class="hover:text-[#1e3a5f] transition-colors">{{ crumb.label | translate }}</a>
          }
        }
      </nav>
    }
  `,
})
export class BreadcrumbComponent {
  protected breadcrumbService = inject(BreadcrumbService);
  protected last = computed(() => {
    const crumbs = this.breadcrumbService.breadcrumbs();
    return crumbs[crumbs.length - 1];
  });
}
