import { Component, inject, signal, HostListener, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { ClickOutsideDirective } from '../../core/directives/click-outside.directive';
import { BreadcrumbComponent } from '../../shared/ui/breadcrumb/breadcrumb';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';
import {
  NavItem, BasicNavItem, CollapsibleNavItem, GroupNavItem
} from '../../core/navigation/nav-item.model';

interface FlyoutChild {
  label: string;
  path: string;
  icon?: string;
  badge?: number | string;
  badgeType?: BasicNavItem['badgeType'];
}

interface FlyoutState {
  label: string;
  children?: FlyoutChild[];
  top: number;
}

@Component({
  selector: 'app-app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ClickOutsideDirective, BreadcrumbComponent, NgIcon, TranslatePipe],
  templateUrl: './app-layout.html',
})
export class AppLayout implements OnDestroy {
  protected auth = inject(AuthService);
  protected lang = inject(LanguageService);
  protected sidebarOpen = signal(window.innerWidth >= 1024);
  protected mobileOpen = signal(false);
  protected userMenuOpen = signal(false);
  protected openCollapsibles = signal<Set<string>>(new Set());
  protected flyout = signal<FlyoutState | null>(null);

  private flyoutTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly navItems = this.auth.navItems;

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

  // ── Flyout (collapsed sidebar) ──────────────────────────────

  protected onItemMouseEnter(event: MouseEvent, item: NavItem): void {
    if (this.isExpanded) return;
    this.clearFlyoutTimer();

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

    if (item.type === 'basic') {
      const b = item as BasicNavItem;
      this.flyout.set({ label: b.label, top: rect.top });
    } else if (item.type === 'collapsible') {
      const c = item as CollapsibleNavItem;
      this.flyout.set({
        label: c.label,
        top: rect.top,
        children: c.children
          .filter(ch => ch.type === 'basic')
          .map(ch => {
            const b = ch as BasicNavItem;
            return { label: b.label, path: b.path, icon: b.icon, badge: b.badge, badgeType: b.badgeType };
          }),
      });
    }
  }

  protected onItemMouseLeave(): void { this.scheduleFlyoutClose(); }
  protected keepFlyout(): void      { this.clearFlyoutTimer(); }
  protected closeFlyoutPanel(): void { this.scheduleFlyoutClose(); }
  protected hideFlyout(): void       { this.flyout.set(null); }

  private scheduleFlyoutClose(): void {
    this.flyoutTimer = setTimeout(() => this.flyout.set(null), 120);
  }

  private clearFlyoutTimer(): void {
    if (this.flyoutTimer) { clearTimeout(this.flyoutTimer); this.flyoutTimer = null; }
  }

  // ───────────────────────────────────────────────────────────

  protected get isMobile(): boolean { return window.innerWidth < 1024; }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 1024) this.mobileOpen.set(false);
  }

  protected toggleSidebar(): void {
    this.hideFlyout();
    this.isMobile
      ? this.mobileOpen.update(v => !v)
      : this.sidebarOpen.update(v => !v);
  }

  protected closeMobileSidebar(): void { this.mobileOpen.set(false); }
  protected toggleUserMenu(): void { this.userMenuOpen.update(v => !v); }
  protected closeUserMenu(): void { this.userMenuOpen.set(false); }
  protected logout(): void { this.userMenuOpen.set(false); this.auth.logout(); }

  ngOnDestroy(): void { this.clearFlyoutTimer(); }
}
