import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DataTableComponent, ColumnDef, PageEvent, PaginatorConfig } from '../../../../shared/design-system/components/table';
import { DropdownOption } from '../../../../shared/design-system/models/components.model';
import { SearchBarComponent } from '../../../../shared/design-system/components/search-bar/search-bar.component';
import { ToastService } from '../../../../core/services/toast.service';
import { NavItemsService } from '../../../../core/http/services/nav-items.service';
import { NavItemDrawerComponent } from '../../components/nav-item-drawer/nav-item-drawer';
import { NavItemConfig } from '../../models/nav-item-config.model';

interface NavItemRow extends NavItemConfig {
  displayLabel: string;
  activeLabel: string;
}

@Component({
  selector: 'app-nav-items-page',
  imports: [TranslatePipe, NgIcon, DataTableComponent, SearchBarComponent, NavItemDrawerComponent],
  templateUrl: './nav-items.html',
  host: { class: 'flex flex-1 min-h-0 flex-col overflow-hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavItemsPage implements OnInit {
  private readonly navItemsService = inject(NavItemsService);
  private readonly toast = inject(ToastService);

  protected readonly drawer = viewChild(NavItemDrawerComponent);
  protected readonly navItems = signal<NavItemConfig[]>([]);
  protected readonly selectedParentOptions = signal<DropdownOption[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly drawerOpen = signal(false);
  protected readonly editingNavItem = signal<NavItemConfig | null>(null);
  protected readonly searchQuery = signal('');

  protected readonly paginator = signal<PaginatorConfig>({
    page: 1,
    pageSize: 5,
    total: 0,
    pageSizeOptions: [5, 10, 20, 50],
  });

  protected readonly columns: ColumnDef<NavItemRow>[] = [
    { key: 'displayLabel', header: 'NAV_ITEM_CONFIG.LABEL', sortable: false },
    { key: 'type', header: 'NAV_ITEM_CONFIG.TYPE', sortable: true },
    { key: 'path', header: 'NAV_ITEM_CONFIG.PATH', sortable: false },
    { key: 'icon', header: 'NAV_ITEM_CONFIG.ICON', sortable: false },
    { key: 'sortOrder', header: 'NAV_ITEM_CONFIG.SORT_ORDER', sortable: true },
    { key: 'activeLabel', header: 'NAV_ITEM_CONFIG.ACTIVE', sortable: false },
  ];

  protected readonly rows = computed<NavItemRow[]>(() =>
    this.navItems().map(item => ({
      ...item,
      displayLabel: item.label ?? item.path ?? item.type,
      activeLabel: item.isActive ? 'Active' : 'Inactive',
    }))
  );

  protected readonly parentSearch = (query: string) =>
    this.navItemsService.searchParentOptions(query, this.editingNavItem()?.id ?? undefined);

  ngOnInit(): void {
    this.loadNavItems();
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
    this.paginator.update(current => ({ ...current, page: 1 }));
    this.loadNavItems();
  }

  protected openCreateDrawer(): void {
    this.editingNavItem.set(null);
    this.selectedParentOptions.set([]);
    this.drawerOpen.set(true);
  }

  protected onRowClick(navItem: NavItemConfig): void {
    this.editingNavItem.set(navItem);
    this.loadSelectedParentOption(navItem.parentId);
    this.drawerOpen.set(true);
  }

  protected onDrawerSubmit(data: { type: 'basic' | 'collapsible' | 'group' | 'divider'; label: string | null; path: string | null; icon: string | null; parentId: string | null; sortOrder: number; isActive: boolean }): void {
    const drawerRef = this.drawer();
    if (!drawerRef) {
      return;
    }

    const editing = this.editingNavItem();
    drawerRef.setLoading(true);

    if (editing) {
      this.navItemsService.updateNavItem(editing.id, data).subscribe({
        next: () => {
          this.closeDrawer();
          this.loadNavItems();
          this.toast.success('NAV_ITEM_CONFIG.UPDATED');
        },
        error: () => {
          drawerRef.setLoading(false);
          this.toast.error('NAV_ITEM_CONFIG.UPDATE_ERROR');
        },
      });
      return;
    }

    this.navItemsService.createNavItem(data).subscribe({
      next: () => {
        this.closeDrawer();
        this.paginator.update(current => ({ ...current, page: 1 }));
        this.loadNavItems();
        this.toast.success('NAV_ITEM_CONFIG.CREATED');
      },
      error: () => {
        drawerRef.setLoading(false);
        this.toast.error('NAV_ITEM_CONFIG.CREATE_ERROR');
      },
    });
  }

  protected onDeleteRequested(): void {
    const editing = this.editingNavItem();
    if (!editing || !confirm('Delete this nav item?')) {
      return;
    }

    this.navItemsService.deleteNavItem(editing.id).subscribe({
      next: () => {
        this.closeDrawer();
        this.loadNavItems();
        this.toast.success('NAV_ITEM_CONFIG.DELETED');
      },
      error: () => {
        this.drawer()?.setLoading(false);
        this.toast.error('NAV_ITEM_CONFIG.DELETE_ERROR');
      },
    });
  }

  protected onPageChange(event: PageEvent): void {
    this.paginator.update(current => ({ ...current, page: event.page, pageSize: event.pageSize }));
    this.loadNavItems();
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingNavItem.set(null);
    this.selectedParentOptions.set([]);
    this.drawer()?.reset();
  }

  private loadNavItems(): void {
    this.isLoading.set(true);
    const { page, pageSize } = this.paginator();
    this.navItemsService.getNavItems(page, pageSize, this.searchQuery() || undefined).subscribe({
      next: response => {
        this.navItems.set(response.items);
        this.paginator.update(current => ({
          ...current,
          total: response.totalCount,
          page: response.page,
          pageSize: response.pageSize,
        }));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('NAV_ITEM_CONFIG.LOAD_ERROR');
      },
    });
  }

  private loadSelectedParentOption(parentId: string | null): void {
    if (!parentId) {
      this.selectedParentOptions.set([]);
      return;
    }

    this.navItemsService.getNavItem(parentId).subscribe({
      next: parent => this.selectedParentOptions.set([{
        label: parent.label ?? parent.path ?? parent.type,
        value: parent.id,
      }]),
      error: () => this.selectedParentOptions.set([]),
    });
  }
}
