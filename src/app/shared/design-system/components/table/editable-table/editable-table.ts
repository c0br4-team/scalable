import {
  Component, Input, Output, EventEmitter,
  ContentChildren, QueryList, AfterContentInit, OnChanges, SimpleChanges,
  signal, TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { EditableColumnDef } from '../table.models';
import { TableCellDirective } from '../table-cell.directive';
import { AutoFocusDirective } from '../auto-focus.directive';

interface ActiveCell {
  rowIndex: number;
  key: string;
}

@Component({
  selector: 'sce-editable-table',
  standalone: true,
  imports: [NgTemplateOutlet, NgIcon, TranslatePipe, AutoFocusDirective],
  templateUrl: './editable-table.html',
})
export class EditableTableComponent<T extends Record<string, any>>
  implements AfterContentInit, OnChanges {

  @Input() columns: EditableColumnDef<T>[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() addRowLabel = 'TABLE.ADD_ROW';
  @Input() deleteRowEnabled = true;

  /** Emite el array completo con los cambios aplicados cuando el usuario guarda */
  @Output() save = new EventEmitter<T[]>();
  /** Emite cuando el usuario descarta los cambios */
  @Output() discard = new EventEmitter<void>();
  /** Emite cuando se agrega una fila (para que el padre pueda asignar ID, etc.) */
  @Output() rowAdd = new EventEmitter<void>();
  /** Emite la fila eliminada */
  @Output() rowDelete = new EventEmitter<T>();

  @ContentChildren(TableCellDirective) private _cellTemplates!: QueryList<TableCellDirective>;

  protected internalData = signal<T[]>([]);
  protected isDirty = signal(false);
  protected activeCell = signal<ActiveCell | null>(null);
  protected editValue = signal<any>(null);

  private templateMap = new Map<string, TemplateRef<any>>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !this.isDirty()) {
      this.internalData.set([...this.data]);
    }
  }

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

  protected isEditing(rowIndex: number, key: string): boolean {
    const a = this.activeCell();
    return a?.rowIndex === rowIndex && a?.key === key;
  }

  protected startEdit(rowIndex: number, col: EditableColumnDef<T>, row: T): void {
    if (!col.editable) return;
    this.editValue.set(this.getCellValue(row, col.key));
    this.activeCell.set({ rowIndex, key: col.key });
  }

  protected commitEdit(rowIndex: number, col: EditableColumnDef<T>): void {
    let newValue: any = this.editValue();
    if (col.type === 'number') newValue = Number(newValue);

    const currentRow = this.internalData()[rowIndex];
    const oldValue = this.getCellValue(currentRow, col.key);

    this.activeCell.set(null);

    // eslint-disable-next-line eqeqeq
    if (newValue != oldValue) {
      this.internalData.update(rows =>
        rows.map((r, i) => i === rowIndex ? { ...r, [col.key]: newValue } : r)
      );
      this.isDirty.set(true);
    }
  }

  protected cancelEdit(): void {
    this.activeCell.set(null);
  }

  protected onKeyDown(event: KeyboardEvent, rowIndex: number, col: EditableColumnDef<T>): void {
    if (event.key === 'Enter') { event.preventDefault(); this.commitEdit(rowIndex, col); }
    if (event.key === 'Escape') { this.cancelEdit(); }
  }

  protected addRow(): void {
    const newRow = this.columns.reduce((acc, col) => {
      acc[col.key as keyof T] = '' as any;
      return acc;
    }, {} as T);
    this.internalData.update(rows => [...rows, newRow]);
    this.isDirty.set(true);
    this.rowAdd.emit();
  }

  protected deleteRow(rowIndex: number, row: T): void {
    this.internalData.update(rows => rows.filter((_, i) => i !== rowIndex));
    this.isDirty.set(true);
    this.rowDelete.emit(row);
  }

  protected onSave(): void {
    this.save.emit(this.internalData());
    this.isDirty.set(false);
  }

  protected onDiscard(): void {
    this.internalData.set([...this.data]);
    this.isDirty.set(false);
    this.activeCell.set(null);
    this.discard.emit();
  }

  protected getCellValue(row: T, key: string): any {
    return key.split('.').reduce((obj: any, k: string) => obj?.[k], row);
  }

  protected get colSpan(): number {
    return this.columns.length + (this.deleteRowEnabled ? 1 : 0);
  }

  protected get skeletonRows(): number[] {
    return Array.from({ length: 3 }, (_, i) => i);
  }
}
