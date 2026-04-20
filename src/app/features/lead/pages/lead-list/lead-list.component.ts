import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LeadService } from '../../services/lead.service';
import { LeadListItem } from '../../models/lead.model';
import { DataTableComponent } from '../../../../shared/design-system/components/table/data-table/data-table';
import { TableCellDirective } from '../../../../shared/design-system/components/table/table-cell.directive';
import { ColumnDef, RowAction, PaginatorConfig, SortEvent, PageEvent } from '../../../../shared/design-system/components/table/table.models';
import { ToastService } from '../../../../core/notifications/toast.service';

@Component({
  selector: 'app-lead-list',
  templateUrl: './lead-list.component.html',
  host: { class: 'flex flex-col flex-1 overflow-hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, DataTableComponent, TableCellDirective, TranslatePipe, DatePipe],
})
export class LeadListComponent implements OnInit {
  private leadService = inject(LeadService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected leads = signal<LeadListItem[]>([]);
  protected titleKey = signal('LEADS.IMPORTED_TITLE');
  protected subtitleKey = signal('LEADS.IMPORTED_SUBTITLE');
  protected listSource = signal<'sheet' | 'manual'>('sheet');
  protected loading = signal(true);
  protected syncing = signal(false);
  protected showFilters = signal(false);

  protected filterSearch = signal('');
  protected filterStatus = signal<string[]>([]);
  protected filterAssignedUser = signal('');

  protected paginator = signal<PaginatorConfig>({
    page: 1, pageSize: 5, total: 0, pageSizeOptions: [5, 10, 20, 50]
  });
  protected sortState = signal<SortEvent>({ column: 'date', direction: 'desc' });

  protected activeFiltersCount = computed(() => {
    let n = 0;
    if (this.filterSearch()) n++;
    if (this.filterStatus().length) n++;
    if (this.filterAssignedUser()) n++;
    return n;
  });

  protected isImportedList = computed(() => this.listSource() === 'sheet');

  protected columns: ColumnDef<LeadListItem>[] = [];

  protected rowActions: RowAction<LeadListItem>[] = [];

  protected readonly statusOptions = [
    { value: 'new',         label: 'LEADS.STATUS_NEW',         cls: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'in_progress', label: 'LEADS.STATUS_IN_PROGRESS', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
    { value: 'converted',   label: 'LEADS.STATUS_CONVERTED',   cls: 'bg-green-100 text-green-700 border-green-300' },
  ];

  ngOnInit(): void {
    this.titleKey.set(this.route.snapshot.data['titleKey'] ?? 'LEADS.IMPORTED_TITLE');
    this.subtitleKey.set(this.route.snapshot.data['subtitleKey'] ?? 'LEADS.IMPORTED_SUBTITLE');
    this.listSource.set(this.route.snapshot.data['source'] ?? 'sheet');

    this.columns = [
      { key: 'date',             header: 'LEADS.COL_DATE',     sortable: true, width: '110px' },
      { key: 'fullName',         header: 'LEADS.COL_NAME',     sortable: true },
      { key: 'phone',            header: 'LEADS.COL_PHONE',    sortable: true, width: '130px' },
      { key: 'email',            header: 'LEADS.COL_EMAIL',    sortable: true },
      { key: 'assignedUserName', header: 'LEADS.COL_ASSIGNED', sortable: true, width: '150px' },
      { key: 'status',           header: 'LEADS.COL_STATUS',   sortable: true, align: 'center', width: '120px' },
    ];
    this.loadLeads();
  }

  private loadLeads(onComplete?: () => void): void {
    this.loading.set(true);
    const { page, pageSize } = this.paginator();
    const { column, direction } = this.sortState();

    this.leadService.getLeads(
      page,
      pageSize,
      this.filterSearch() || undefined,
      this.filterStatus(),
      this.filterAssignedUser() || undefined,
      this.listSource(),
      column,
      direction,
    ).subscribe({
      next: (result) => {
        this.leads.set(result.items);
        this.paginator.update(p => ({
          ...p,
          total: result.total,
          page: result.pageNumber,
          pageSize: result.pageSize,
        }));
        this.loading.set(false);
        onComplete?.();
      },
      error: () => this.loading.set(false),
    });
  }

  protected onSort(event: SortEvent): void {
    this.sortState.set(event);
    this.paginator.update(p => ({ ...p, page: 1 }));
    this.loadLeads();
  }

  protected onPage(event: PageEvent): void {
    this.paginator.update(p => ({ ...p, page: event.page, pageSize: event.pageSize }));
    this.loadLeads();
  }

  protected onRowClick(row: LeadListItem): void {
    const leadRef = row.leadId && row.leadId !== '00000000-0000-0000-0000-000000000000'
      ? row.leadId
      : row.rowIndex;
    if (!leadRef) {
      return;
    }

    this.router.navigate(['/leads', leadRef], {
      state: {
        leadName: row.fullName ?? '',
        fromListSource: this.listSource(),
      },
    });
  }

  protected applyFilters(): void {
    this.showFilters.set(false);
    this.paginator.update(p => ({ ...p, page: 1 }));
    this.loadLeads();
  }

  protected clearFilters(): void {
    this.filterSearch.set('');
    this.filterStatus.set([]);
    this.filterAssignedUser.set('');
    this.paginator.update(p => ({ ...p, page: 1 }));
    this.loadLeads();
  }

  protected toggleStatus(v: string): void {
    this.filterStatus.update(a => a.includes(v) ? a.filter(x => x !== v) : [...a, v]);
  }

  protected statusCls(status: string): string {
    return {
      new:         'bg-blue-100 text-blue-700',
      in_progress: 'bg-amber-100 text-amber-700',
      converted:   'bg-green-100 text-green-700',
    }[status] ?? 'bg-gray-100 text-gray-500';
  }

  protected statusKey(status: string): string {
    return {
      new:         'LEADS.STATUS_NEW',
      in_progress: 'LEADS.STATUS_IN_PROGRESS',
      converted:   'LEADS.STATUS_CONVERTED',
    }[status] ?? status;
  }

  protected sourceCls(sourceStatus: string): string {
    return {
      active: 'bg-emerald-50 text-emerald-700',
      removed_from_source: 'bg-rose-50 text-rose-700',
      legacy: 'bg-slate-100 text-slate-600',
      manual: 'bg-violet-50 text-violet-700',
    }[sourceStatus] ?? 'bg-slate-100 text-slate-600';
  }

  protected sourceKey(sourceStatus: string): string {
    return {
      active: 'LEADS.SOURCE_ACTIVE',
      removed_from_source: 'LEADS.SOURCE_REMOVED',
      legacy: 'LEADS.SOURCE_LEGACY',
      manual: 'LEADS.SOURCE_MANUAL',
    }[sourceStatus] ?? 'LEADS.SOURCE_LEGACY';
  }

  protected onSync(): void {
    if (this.syncing()) return;
    this.syncing.set(true);
    this.leadService.syncLeads().subscribe({
      next: () => {
        this.syncing.set(false);
        this.paginator.update(p => ({ ...p, page: 1 }));
        this.loadLeads(() => this.toast.success(this.translate.instant('LEADS.SYNC_OK')));
      },
      error: () => {
        this.syncing.set(false);
        this.toast.error(this.translate.instant('LEADS.SYNC_ERROR'));
      },
    });
  }
}
