import { ChangeDetectionStrategy, Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { DataTableComponent, ColumnDef, PaginatorConfig, PageEvent } from '../../../../shared/design-system/components/table';
import { SearchBarComponent } from '../../../../shared/design-system/components/search-bar/search-bar.component';
import { ToastService } from '../../../../core/services/toast.service';
import { CatalogService } from '../../../../core/http/services/catalog.service';
import { CatalogDrawerComponent } from '../../components/catalog-drawer/catalog-drawer';
import { CatalogConfig } from '../../models/catalog-config.model';

@Component({
  selector: 'app-catalog-list',
  imports: [TranslatePipe, NgIcon, DataTableComponent, SearchBarComponent, CatalogDrawerComponent],
  templateUrl: './catalog-list.html',
  host: { class: 'flex min-h-0 flex-1 flex-col overflow-hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogListPage implements OnInit {
  private catalogService = inject(CatalogService);
  private toast          = inject(ToastService);

  protected drawer        = viewChild(CatalogDrawerComponent);
  protected catalogs      = signal<CatalogConfig[]>([]);
  protected isLoading     = signal(true);
  protected drawerOpen    = signal(false);
  protected editingCatalog = signal<CatalogConfig | null>(null);
  protected searchQuery   = signal('');

  protected paginator = signal<PaginatorConfig>({
    page: 1, pageSize: 20, total: 0, pageSizeOptions: [10, 20, 50]
  });

  protected readonly columns: ColumnDef<CatalogConfig>[] = [
    { key: 'id',          header: 'CATALOGS.ID',          sortable: false },
    { key: 'tableName',   header: 'CATALOGS.TABLE_NAME',  sortable: true },
    { key: 'keyField',    header: 'CATALOGS.KEY_FIELD',   sortable: false },
    { key: 'valueField',  header: 'CATALOGS.VALUE_FIELD', sortable: false },
    { key: 'conditions',  header: 'CATALOGS.CONDITIONS',  sortable: false },
    { key: 'description', header: 'CATALOGS.DESCRIPTION', sortable: false },
  ];

  ngOnInit(): void { this.loadCatalogs(); }

  private loadCatalogs(): void {
    this.isLoading.set(true);
    const { page, pageSize } = this.paginator();
    this.catalogService.getConfigs(page, pageSize, this.searchQuery() || undefined).subscribe({
      next: res => {
        this.catalogs.set(res.items);
        this.paginator.update(p => ({ ...p, total: res.totalCount, page: res.page, pageSize: res.pageSize }));
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('CATALOGS.LOAD_ERROR');
        this.isLoading.set(false);
      },
    });
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
    this.paginator.update(p => ({ ...p, page: 1 }));
    this.loadCatalogs();
  }

  protected openCreateDrawer(): void {
    this.editingCatalog.set(null);
    this.drawerOpen.set(true);
  }

  protected onRowClick(catalog: CatalogConfig): void {
    this.editingCatalog.set(catalog);
    this.drawerOpen.set(true);
  }

  protected onDrawerSubmit(data: { tableName: string; keyField: string; valueField: string; conditions: string | null; description: string | null }): void {
    const drawerRef = this.drawer();
    if (!drawerRef) return;
    const editing = this.editingCatalog();
    drawerRef.setLoading(true);

    const req = { tableName: data.tableName, keyField: data.keyField, valueField: data.valueField, conditions: data.conditions, description: data.description };

    if (editing) {
      this.catalogService.updateConfig(editing.id, req).subscribe({
        next: () => { this.closeDrawer(); this.loadCatalogs(); this.toast.success('CATALOGS.UPDATED'); },
        error: () => { drawerRef.setLoading(false); this.toast.error('CATALOGS.UPDATE_ERROR'); },
      });
    } else {
      this.catalogService.createConfig(req).subscribe({
        next: () => { this.closeDrawer(); this.paginator.update(p => ({ ...p, page: 1 })); this.loadCatalogs(); this.toast.success('CATALOGS.CREATED'); },
        error: () => { drawerRef.setLoading(false); this.toast.error('CATALOGS.CREATE_ERROR'); },
      });
    }
  }

  protected onDeleteClick(catalog: CatalogConfig, event: Event): void {
    event.stopPropagation();
    if (!confirm('¿Eliminar este catálogo?')) return;
    this.catalogService.deleteConfig(catalog.id).subscribe({
      next: () => { this.loadCatalogs(); this.toast.success('CATALOGS.DELETED'); },
      error: () => this.toast.error('CATALOGS.DELETE_ERROR'),
    });
  }

  protected onPageChange(event: PageEvent): void {
    this.paginator.update(p => ({ ...p, page: event.page, pageSize: event.pageSize }));
    this.loadCatalogs();
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingCatalog.set(null);
    this.drawer()?.reset();
  }
}
