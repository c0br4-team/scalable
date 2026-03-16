import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { AuthService } from '../../core/auth/services/auth.service';
import { ClickOutsideDirective } from '../../core/directives/click-outside.directive';
import { BreadcrumbComponent } from '../../shared/ui/breadcrumb/breadcrumb';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';
import {
  NavItem, BasicNavItem, CollapsibleNavItem, GroupNavItem
} from '../../core/navigation/nav-item.model';

@Component({
  selector: 'app-app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ClickOutsideDirective, BreadcrumbComponent, NgIcon, TranslatePipe],
  templateUrl: './app-layout.html',
  animations: [
    trigger('collapse', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ height: 0, opacity: 0 })),
      ]),
    ]),
  ],
})
export class AppLayout {
  protected auth = inject(AuthService);
  protected lang = inject(LanguageService);
  protected sidebarOpen = signal(window.innerWidth >= 1024);
  protected mobileOpen = signal(false);
  protected userMenuOpen = signal(false);
  protected openCollapsibles = signal<Set<string>>(new Set());

  protected navItems: NavItem[] = [
    { type: 'basic', label: 'NAV.DASHBOARD', path: '/dashboard', icon: 'heroHome' },
    { type: 'divider' },
    {
      type: 'group',
      label: 'NAV.MANAGEMENT',
      children: [
        { type: 'basic', label: 'NAV.CALENDAR', path: '/calendar', icon: 'heroCalendar' },
        { type: 'basic', label: 'NAV.CASES', path: '/cases', icon: 'heroDocumentText', badge: 8, badgeType: 'danger' },
        {
          type: 'collapsible',
          label: 'NAV.REPORTS',
          icon: 'heroChartBar',
          children: [
            { type: 'basic', label: 'NAV.REPORTS_SUMMARY', path: '/reports/summary', icon: 'heroChartBar' },
            { type: 'basic', label: 'NAV.REPORTS_DETAIL', path: '/reports/detail', icon: 'heroDocumentText' },
          ],
        },
      ],
    },
    {
      type: 'group',
      label: 'NAV.ADMIN',
      children: [
        { type: 'basic', label: 'NAV.USERS', path: '/users', icon: 'heroUsers' },
        { type: 'basic', label: 'NAV.SETTINGS', path: '/settings', icon: 'heroCog6Tooth' },
      ],
    },
  ];

  protected get isExpanded(): boolean {
    return this.sidebarOpen() || this.mobileOpen();
  }

  protected asBasic(item: NavItem): BasicNavItem { return item as BasicNavItem; }
  protected asCollapsible(item: NavItem): CollapsibleNavItem { return item as CollapsibleNavItem; }
  protected asGroup(item: NavItem): GroupNavItem { return item as GroupNavItem; }

  protected isCollapsibleOpen(label: string): boolean {
    return this.openCollapsibles().has(label);
  }

  protected toggleCollapsible(label: string): void {
    this.openCollapsibles.update(set => {
      const next = new Set(set);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  protected badgeClasses(type: BasicNavItem['badgeType']): string {
    const map: Record<NonNullable<BasicNavItem['badgeType']>, string> = {
      primary: 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
    };
    return map[type ?? 'primary'];
  }

  protected get isMobile(): boolean { return window.innerWidth < 1024; }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 1024) this.mobileOpen.set(false);
  }

  protected toggleSidebar(): void {
    this.isMobile
      ? this.mobileOpen.update(v => !v)
      : this.sidebarOpen.update(v => !v);
  }

  protected closeMobileSidebar(): void { this.mobileOpen.set(false); }
  protected toggleUserMenu(): void { this.userMenuOpen.update(v => !v); }
  protected closeUserMenu(): void { this.userMenuOpen.set(false); }
  protected logout(): void { this.userMenuOpen.set(false); this.auth.logout(); }
}
