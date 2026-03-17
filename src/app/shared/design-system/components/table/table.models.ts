export type SortDirection = 'asc' | 'desc' | null;
export type ColumnAlign = 'left' | 'center' | 'right';
export type EditableCellType = 'text' | 'number' | 'select' | 'date';
export type RowActionColor = 'primary' | 'danger' | 'warning' | 'success';

export interface ColumnDef<T = any> {
  key: string;
  header: string;
  width?: string;
  align?: ColumnAlign;
  sortable?: boolean;
}

export interface EditableColumnDef<T = any> extends ColumnDef<T> {
  editable?: boolean;
  type?: EditableCellType;
  options?: { label: string; value: string }[];
}

export interface RowAction<T = any> {
  label: string;
  icon?: string;
  color?: RowActionColor;
  action: (row: T) => void;
  visible?: (row: T) => boolean;
}

export interface PaginatorConfig {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
}

export interface SortEvent {
  column: string;
  direction: Exclude<SortDirection, null>;
}

export interface PageEvent {
  page: number;
  pageSize: number;
}

export interface CellChangeEvent<T = any> {
  row: T;
  rowIndex: number;
  field: keyof T;
  value: unknown;
}
