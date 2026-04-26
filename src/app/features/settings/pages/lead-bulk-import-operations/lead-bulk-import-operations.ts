import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SearchBarComponent } from '../../../../shared/design-system/components/search-bar/search-bar.component';
import { DataTableComponent, ColumnDef, PageEvent, PaginatorConfig } from '../../../../shared/design-system/components/table';
import { ToastService } from '../../../../core/services/toast.service';
import { LeadBulkImportOperationsService } from '../../../../core/http/services/lead-bulk-import-operations.service';
import { LeadBulkImportOperationDetail, LeadBulkImportOperationListItem } from '../../models/lead-bulk-import-operation.model';

interface LeadBulkImportOperationRow {
  operationId: string;
  requestedByName: string;
  statusLabel: string;
  receivedCount: number;
  resultSummary: string;
  requestedAtLabel: string;
  completedAtLabel: string;
}

@Component({
  selector: 'app-lead-bulk-import-operations-page',
  standalone: true,
  imports: [TranslatePipe, SearchBarComponent, DataTableComponent],
  templateUrl: './lead-bulk-import-operations.html',
  host: { class: 'flex flex-1 min-h-0 flex-col overflow-hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadBulkImportOperationsPage {
  private readonly operationsService = inject(LeadBulkImportOperationsService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  protected readonly operations = signal<LeadBulkImportOperationListItem[]>([]);
  protected readonly selectedOperation = signal<LeadBulkImportOperationDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly detailLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal('');
  protected readonly paginator = signal<PaginatorConfig>({ page: 1, pageSize: 20, total: 0, pageSizeOptions: [10, 20, 50] });
  protected readonly statusOptions = [
    { value: '', label: 'LEAD_IMPORT_OPERATIONS.FILTERS.ALL_STATUSES' },
    { value: 'queued', label: 'LEAD_IMPORT_OPERATIONS.STATUS.QUEUED' },
    { value: 'running', label: 'LEAD_IMPORT_OPERATIONS.STATUS.RUNNING' },
    { value: 'completed', label: 'LEAD_IMPORT_OPERATIONS.STATUS.COMPLETED' },
    { value: 'completed_with_errors', label: 'LEAD_IMPORT_OPERATIONS.STATUS.COMPLETED_WITH_ERRORS' },
    { value: 'failed', label: 'LEAD_IMPORT_OPERATIONS.STATUS.FAILED' },
  ] as const;

  protected readonly columns: ColumnDef<LeadBulkImportOperationRow>[] = [
    { key: 'requestedByName', header: 'LEAD_IMPORT_OPERATIONS.COLUMNS.REQUESTED_BY' },
    { key: 'statusLabel', header: 'LEAD_IMPORT_OPERATIONS.COLUMNS.STATUS', width: '170px' },
    { key: 'receivedCount', header: 'LEAD_IMPORT_OPERATIONS.COLUMNS.RECEIVED', width: '110px', align: 'right' },
    { key: 'resultSummary', header: 'LEAD_IMPORT_OPERATIONS.COLUMNS.RESULT', width: '220px' },
    { key: 'requestedAtLabel', header: 'LEAD_IMPORT_OPERATIONS.COLUMNS.REQUESTED_AT', width: '170px' },
    { key: 'completedAtLabel', header: 'LEAD_IMPORT_OPERATIONS.COLUMNS.COMPLETED_AT', width: '170px' },
  ];

  protected readonly rows = computed<LeadBulkImportOperationRow[]>(() => this.operations().map(operation => ({
    operationId: operation.operationId,
    requestedByName: operation.requestedByName,
    statusLabel: this.translateStatus(operation.status),
    receivedCount: operation.receivedCount,
    resultSummary: `${operation.createdCount}/${operation.skippedCount}/${operation.failedCount}`,
    requestedAtLabel: this.formatDate(operation.requestedAtUtc),
    completedAtLabel: this.formatDate(operation.completedAtUtc),
  })));

  protected readonly selectedSummary = computed(() => {
    const operation = this.selectedOperation();
    if (!operation) {
      return [] as Array<{ label: string; value: string }>;
    }

    return [
      { label: 'LEAD_IMPORT_OPERATIONS.DETAIL.REQUESTED_BY', value: operation.requestedByName },
      { label: 'LEAD_IMPORT_OPERATIONS.DETAIL.REQUESTED_BY_ID', value: operation.requestedByUserIdAw },
      { label: 'LEAD_IMPORT_OPERATIONS.DETAIL.STATUS', value: this.translateStatus(operation.status) },
      { label: 'LEAD_IMPORT_OPERATIONS.DETAIL.RECEIVED', value: String(operation.receivedCount) },
      { label: 'LEAD_IMPORT_OPERATIONS.DETAIL.CREATED', value: String(operation.createdCount) },
      { label: 'LEAD_IMPORT_OPERATIONS.DETAIL.SKIPPED', value: String(operation.skippedCount) },
      { label: 'LEAD_IMPORT_OPERATIONS.DETAIL.FAILED', value: String(operation.failedCount) },
      { label: 'LEAD_IMPORT_OPERATIONS.DETAIL.REQUESTED_AT', value: this.formatDate(operation.requestedAtUtc) },
      { label: 'LEAD_IMPORT_OPERATIONS.DETAIL.STARTED_AT', value: this.formatDate(operation.startedAtUtc) },
      { label: 'LEAD_IMPORT_OPERATIONS.DETAIL.COMPLETED_AT', value: this.formatDate(operation.completedAtUtc) },
    ];
  });

  constructor() {
    this.loadOperations();
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
    this.paginator.update(current => ({ ...current, page: 1 }));
    this.loadOperations();
  }

  protected onStatusChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.paginator.update(current => ({ ...current, page: 1 }));
    this.loadOperations();
  }

  protected onPageChange(event: PageEvent): void {
    this.paginator.update(current => ({ ...current, page: event.page, pageSize: event.pageSize }));
    this.loadOperations();
  }

  protected onRowClick(row: LeadBulkImportOperationRow): void {
    this.loadOperationDetail(row.operationId);
  }

  protected refresh(): void {
    this.loadOperations();
    const selected = this.selectedOperation();
    if (selected) {
      this.loadOperationDetail(selected.operationId, false);
    }
  }

  protected statusTone(status: string): string {
    return {
      queued: 'bg-slate-100 text-slate-700',
      running: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      completed_with_errors: 'bg-amber-100 text-amber-700',
      failed: 'bg-red-100 text-red-700',
    }[status.toLowerCase()] ?? 'bg-slate-100 text-slate-700';
  }

  protected formatDate(value: string | null): string {
    if (!value) {
      return this.translate.instant('LEAD_IMPORT_OPERATIONS.NOT_AVAILABLE');
    }

    return new Date(value).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected translateStatus(status: string): string {
    return this.translate.instant(`LEAD_IMPORT_OPERATIONS.STATUS.${status.toUpperCase()}`);
  }

  private loadOperations(): void {
    this.loading.set(true);
    const { page, pageSize } = this.paginator();
    this.operationsService.getOperations(page, pageSize, this.searchQuery() || undefined, this.statusFilter() || undefined).subscribe({
      next: response => {
        this.operations.set(response.items);
        this.paginator.update(current => ({
          ...current,
          total: response.totalCount,
          page: response.page,
          pageSize: response.pageSize,
        }));
        this.loading.set(false);

        const selected = this.selectedOperation();
        if (selected && !response.items.some(item => item.operationId === selected.operationId)) {
          this.selectedOperation.set(null);
        }
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('LEAD_IMPORT_OPERATIONS.LOAD_ERROR');
      },
    });
  }

  private loadOperationDetail(operationId: string, notifyOnError = true): void {
    this.detailLoading.set(true);
    this.operationsService.getOperation(operationId).subscribe({
      next: response => {
        this.selectedOperation.set(response);
        this.detailLoading.set(false);
      },
      error: () => {
        this.detailLoading.set(false);
        if (notifyOnError) {
          this.toast.error('LEAD_IMPORT_OPERATIONS.DETAIL.LOAD_ERROR');
        }
      },
    });
  }
}
