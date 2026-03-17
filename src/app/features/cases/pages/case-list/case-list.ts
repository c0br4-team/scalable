import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { CaseService } from '../../services/case.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { Case, CaseFilters, CasePriority, CaseStatus, CaseType } from '../../models/case.model';
import { DataTableComponent } from '../../../../shared/design-system/components/table/data-table/data-table';
import { TableCellDirective } from '../../../../shared/design-system/components/table/table-cell.directive';
import { ColumnDef, RowAction, PaginatorConfig, SortEvent, PageEvent } from '../../../../shared/design-system/components/table/table.models';

@Component({
  selector: 'app-case-list',
  templateUrl: './case-list.html',
  host: { class: 'flex flex-col flex-1 overflow-hidden' },
  imports: [NgIcon, DataTableComponent, TableCellDirective],
})
export class CaseListPage implements OnInit {
  private caseService = inject(CaseService);
  private auth = inject(AuthService);
  private router = inject(Router);

  protected allCases = signal<Case[]>([]);
  protected loading = signal(true);
  protected showFilters = signal(false);

  // ── Filter state ─────────────────────────────────────────────
  protected filterSearch   = signal('');
  protected filterStatus   = signal<CaseStatus[]>([]);
  protected filterType     = signal<CaseType[]>([]);
  protected filterPriority = signal<CasePriority[]>([]);
  protected filterDateFrom = signal('');
  protected filterDateTo   = signal('');

  // ── Sort & pagination ─────────────────────────────────────────
  protected currentSort = signal<SortEvent | null>(null);
  protected paginator   = signal<PaginatorConfig>({ page: 1, pageSize: 10, total: 0, pageSizeOptions: [10, 20, 50] });

  // ── Computed filtered + sorted + paged data ───────────────────
  protected filteredCases = computed(() => {
    const userId  = this.auth.user()?.id;
    const search  = this.filterSearch().toLowerCase().trim();
    const status  = this.filterStatus();
    const type    = this.filterType();
    const priority = this.filterPriority();
    const dateFrom = this.filterDateFrom();
    const dateTo   = this.filterDateTo();

    return this.allCases().filter(c => {
      if (userId && !c.assignedTo.includes(userId)) return false;
      if (search && !c.title.toLowerCase().includes(search) && !c.caseNumber.toLowerCase().includes(search)) return false;
      if (status.length && !status.includes(c.status)) return false;
      if (type.length && !type.includes(c.type)) return false;
      if (priority.length && !priority.includes(c.priority)) return false;
      if (dateFrom && c.openedAt < dateFrom) return false;
      if (dateTo && c.openedAt > dateTo + 'T23:59:59') return false;
      return true;
    });
  });

  protected sortedCases = computed(() => {
    const sort = this.currentSort();
    const data = [...this.filteredCases()];
    if (!sort) return data;
    return data.sort((a, b) => {
      const va = String((a as any)[sort.column] ?? '');
      const vb = String((b as any)[sort.column] ?? '');
      const cmp = va.localeCompare(vb);
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  });

  protected pagedCases = computed(() => {
    const { page, pageSize } = this.paginator();
    return this.sortedCases().slice((page - 1) * pageSize, page * pageSize);
  });

  protected activeFiltersCount = computed(() => {
    let n = 0;
    if (this.filterSearch()) n++;
    if (this.filterStatus().length) n++;
    if (this.filterType().length) n++;
    if (this.filterPriority().length) n++;
    if (this.filterDateFrom() || this.filterDateTo()) n++;
    return n;
  });

  // ── Table config ──────────────────────────────────────────────
  protected columns: ColumnDef<Case>[] = [
    { key: 'caseNumber', header: 'Nro. Expediente', sortable: true, width: '140px' },
    { key: 'title',      header: 'Asunto',          sortable: true },
    { key: 'clientName', header: 'Cliente',          sortable: true },
    { key: 'type',       header: 'Tipo',             align: 'center', width: '110px' },
    { key: 'status',     header: 'Estado',           align: 'center', width: '110px' },
    { key: 'openedAt',   header: 'Apertura',         sortable: true,  width: '110px', align: 'right' },
    { key: 'nextHearing',header: 'Próx. audiencia',  width: '150px',  align: 'center' },
  ];

  protected rowActions: RowAction<Case>[] = [
    {
      label: 'Ver expediente', icon: 'heroArrowTopRightOnSquare', color: 'primary',
      action: (row) => this.router.navigate(['/cases', row.id]),
    },
  ];

  // ── Filter options ────────────────────────────────────────────
  protected readonly statusOptions: { value: CaseStatus; label: string; cls: string }[] = [
    { value: 'active',    label: 'Activo',    cls: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'pending',   label: 'Pendiente', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
    { value: 'closed',    label: 'Cerrado',   cls: 'bg-gray-200 text-gray-600 border-gray-300' },
    { value: 'suspended', label: 'Suspendido',cls: 'bg-red-100 text-red-700 border-red-300' },
  ];

  protected readonly typeOptions: { value: CaseType; label: string; cls: string }[] = [
    { value: 'civil',      label: 'Civil',      cls: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'contratos',  label: 'Contratos',  cls: 'bg-violet-100 text-violet-700 border-violet-300' },
    { value: 'laboral',    label: 'Laboral',    cls: 'bg-orange-100 text-orange-700 border-orange-300' },
    { value: 'societario', label: 'Societario', cls: 'bg-teal-100 text-teal-700 border-teal-300' },
  ];

  protected readonly priorityOptions: { value: CasePriority; label: string; cls: string }[] = [
    { value: 'low',      label: 'Baja',     cls: 'bg-gray-100 text-gray-600 border-gray-300' },
    { value: 'medium',   label: 'Media',    cls: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'high',     label: 'Alta',     cls: 'bg-amber-100 text-amber-700 border-amber-300' },
    { value: 'critical', label: 'Crítica',  cls: 'bg-red-100 text-red-700 border-red-300' },
  ];

  ngOnInit(): void {
    this.caseService.getAll().subscribe({
      next: (cases) => {
        this.allCases.set(cases);
        this.paginator.update(p => ({ ...p, total: cases.length }));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onSort(event: SortEvent): void {
    this.currentSort.set(event);
    this.paginator.update(p => ({ ...p, page: 1 }));
  }

  protected onPage(event: PageEvent): void {
    this.paginator.update(p => ({ ...p, page: event.page, pageSize: event.pageSize }));
  }

  protected onRowClick(row: Case): void {
    this.router.navigate(['/cases', row.id]);
  }

  protected applyFilters(): void {
    this.showFilters.set(false);
    this.paginator.update(p => ({ ...p, page: 1, total: this.filteredCases().length }));
  }

  protected clearFilters(): void {
    this.filterSearch.set('');
    this.filterStatus.set([]);
    this.filterType.set([]);
    this.filterPriority.set([]);
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.paginator.update(p => ({ ...p, page: 1 }));
  }

  protected toggleStatus(v: CaseStatus): void {
    this.filterStatus.update(a => a.includes(v) ? a.filter(x => x !== v) : [...a, v]);
  }

  protected toggleType(v: CaseType): void {
    this.filterType.update(a => a.includes(v) ? a.filter(x => x !== v) : [...a, v]);
  }

  protected togglePriority(v: CasePriority): void {
    this.filterPriority.update(a => a.includes(v) ? a.filter(x => x !== v) : [...a, v]);
  }

  // ── Display helpers ───────────────────────────────────────────
  protected statusCls(status: CaseStatus): string {
    return { active: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', closed: 'bg-gray-200 text-gray-500', suspended: 'bg-red-100 text-red-700' }[status];
  }
  protected statusLabel(status: CaseStatus): string {
    return { active: 'Activo', pending: 'Pendiente', closed: 'Cerrado', suspended: 'Suspendido' }[status];
  }
  protected typeCls(type: CaseType): string {
    return { civil: 'bg-blue-100 text-blue-700', contratos: 'bg-violet-100 text-violet-700', laboral: 'bg-orange-100 text-orange-700', societario: 'bg-teal-100 text-teal-700' }[type];
  }
  protected typeLabel(type: CaseType): string {
    return { civil: 'Civil', contratos: 'Contratos', laboral: 'Laboral', societario: 'Societario' }[type];
  }

  protected hearingBadge(c: Case): { cls: string; label: string } | null {
    if (!c.nextHearing) return null;
    const diff = new Date(c.nextHearing).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (diff < 0) return { cls: 'bg-red-100 text-red-700', label: 'Vencida' };
    if (days <= 3) return { cls: 'bg-red-100 text-red-700', label: `${days}d` };
    if (days <= 7) return { cls: 'bg-amber-100 text-amber-700', label: `${days}d` };
    return { cls: 'bg-gray-100 text-gray-500', label: this.formatDate(c.nextHearing) };
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
}
