import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbService } from '../../../core/navigation/breadcrumb.service';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink, NgIcon],
  template: `
    @if (breadcrumbService.breadcrumbs().length) {
      <nav class="flex items-center gap-1 text-sm text-gray-500">
        <a routerLink="/dashboard" class="hover:text-[#1e3a5f] transition-colors">Inicio</a>
        @for (crumb of breadcrumbService.breadcrumbs(); track crumb.path; let last = $last) {
          <ng-icon name="heroChevronRight" class="text-sm shrink-0" />
          @if (last) {
            <span class="text-gray-800 font-medium">{{ crumb.label }}</span>
          } @else {
            <a [routerLink]="crumb.path" class="hover:text-[#1e3a5f] transition-colors">{{ crumb.label }}</a>
          }
        }
      </nav>
    }
  `,
})
export class BreadcrumbComponent {
  protected breadcrumbService = inject(BreadcrumbService);
}
