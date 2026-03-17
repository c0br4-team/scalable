import {
  Component, Input, Output, EventEmitter,
  ContentChildren, QueryList, AfterContentInit,
  signal, TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  ColumnDef, RowAction, PaginatorConfig,
  SortEvent, PageEvent, SortDirection, RowActionColor,
} from '../table.models';
import { TableCellDirective } from '../table-cell.directive';

@Component({
  selector: 'sce-data-table',
  standalone: true,
  imports: [NgTemplateOutlet, NgIcon, TranslatePipe, TableCellDirective],
  templateUrl: './data-table.html',
})
export class DataTableComponent<T extends Record<string, any>> implements AfterContentInit {
  @Input() columns: ColumnDef<T>[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'TABLE.EMPTY';
  @Input() selectable = false;
  @Input() striped = false;
  @Input() compact = false;
  @Input() stickyHeader = false;
  @Input() paginator?: PaginatorConfig;
  @Input() rowActions: RowAction<T>[] = [];

  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() rowClick = new EventEmitter<T>();

  @ContentChildren(TableCellDirective) private _cellTemplates!: QueryList<TableCellDirective>;

  protected selectedRows = signal<Set<T>>(new Set());
  protected currentSort = signal<SortEvent | null>(null);
  private templateMap = new Map<string, TemplateRef<any>>();

  ngAfterContentInit(): void {
    this._rebuildTemplateMap();
    this._cellTemplates.changes.subscribe(() => this._rebuildTemplateMap());
  }

  private _rebuildTemplateMap(): void {
    this.templateMap.clear();
    this._cellTemplates.forEach(d => this.templateMap.set(d.key, d.template));
  }

  protected getTemplate(key: string): TemplateRef<any> | null {
    return this.templateMap.get(key) ?? null;
  }

  protected get allSelected(): boolean {
    return this.data.length > 0 && this.data.every(row => this.selectedRows().has(row));
  }

  protected get indeterminate(): boolean {
    return this.selectedRows().size > 0 && !this.allSelected;
  }

  protected isSelected(row: T): boolean {
    return this.selectedRows().has(row);
  }

  protected toggleAll(): void {
    const next = new Set<T>(this.allSelected ? [] : this.data);
    this.selectedRows.set(next);
    this.selectionChange.emit([...next]);
  }

  protected toggleRow(row: T, event: Event): void {
    event.stopPropagation();
    const current = new Set(this.selectedRows());
    current.has(row) ? current.delete(row) : current.add(row);
    this.selectedRows.set(current);
    this.selectionChange.emit([...current]);
  }

  protected onSort(col: ColumnDef<T>): void {
    if (!col.sortable) return;
    const current = this.currentSort();
    const direction = current?.column === col.key && current?.direction === 'asc' ? 'desc' : 'asc';
    const event: SortEvent = { column: col.key, direction };
    this.currentSort.set(event);
    this.sortChange.emit(event);
  }

  protected getSortDirection(key: string): SortDirection {
    const s = this.currentSort();
    return s?.column === key ? s.direction : null;
  }

  protected getCellValue(row: T, key: string): any {
    return key.split('.').reduce((obj: any, k: string) => obj?.[k], row);
  }

  protected onPageChange(page: number): void {
    if (!this.paginator) return;
    this.pageChange.emit({ page, pageSize: this.paginator.pageSize });
  }

  protected onPageSizeChange(event: Event): void {
    if (!this.paginator) return;
    const pageSize = parseInt((event.target as HTMLSelectElement).value, 10);
    this.pageChange.emit({ page: 1, pageSize });
  }

  protected get totalPages(): number {
    if (!this.paginator) return 0;
    return Math.ceil(this.paginator.total / this.paginator.pageSize);
  }

  protected get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.paginator?.page ?? 1;
    const pages: number[] = [];
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      pages.push(i);
    }
    return pages;
  }

  protected get showFirstEllipsis(): boolean {
    return (this.paginator?.page ?? 1) - 2 > 1;
  }

  protected get showLastEllipsis(): boolean {
    return (this.paginator?.page ?? 1) + 2 < this.totalPages;
  }

  protected get paginatorFrom(): number {
    if (!this.paginator) return 0;
    return (this.paginator.page - 1) * this.paginator.pageSize + 1;
  }

  protected get paginatorTo(): number {
    if (!this.paginator) return 0;
    return Math.min(this.paginator.page * this.paginator.pageSize, this.paginator.total);
  }

  protected visibleActions(row: T): RowAction<T>[] {
    return this.rowActions.filter(a => !a.visible || a.visible(row));
  }

  protected get skeletonRows(): number[] {
    return Array.from({ length: 5 }, (_, i) => i);
  }

  protected get colSpan(): number {
    return this.columns.length + (this.selectable ? 1 : 0) + (this.rowActions.length ? 1 : 0);
  }

  protected get cellPadding(): string {
    return this.compact ? 'px-4 py-2' : 'px-4 py-3';
  }

  protected actionColorCls(color: RowActionColor | undefined): string {
    const map: Record<RowActionColor, string> = {
      primary: 'text-[#1e3a5f] hover:bg-blue-50',
      danger:  'text-red-600 hover:bg-red-50',
      warning: 'text-amber-600 hover:bg-amber-50',
      success: 'text-green-600 hover:bg-green-50',
    };
    return map[color ?? 'primary'];
  }
}
