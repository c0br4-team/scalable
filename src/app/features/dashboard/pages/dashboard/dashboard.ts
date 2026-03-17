import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft, heroRocketLaunch, heroDocumentText,
  heroPencilSquare, heroStar, heroTrash, heroCheckCircle,
  heroArrowDownTray, heroArrowPath,
} from '@ng-icons/heroicons/outline';
import { ToastService } from '../../../../core/notifications/toast.service';
import { DropdownComponent } from '../../../../shared/design-system/components/dropdown/dropdown.component';
import { DropdownConfig, DropdownOption } from '../../../../shared/design-system/models/components.model';
import { ClientService } from '../../../../core/http/services/client.service';
import { RichTextEditorComponent } from '../../../../shared/design-system/components/rich-text-editor/rich-text-editor.component';
import { ConfirmDialogService } from '../../../../shared/design-system/services/confirm-dialog.service';
import { ProgressComponent } from '../../../../shared/design-system/components/progress/progress.component';
import { SearchBarComponent } from '../../../../shared/design-system/components/search-bar/search-bar.component';
import { ButtonComponent } from '../../../../shared/design-system/components/button/button.component';
import { DataTableComponent } from '../../../../shared/design-system/components/table/data-table/data-table';
import { EditableTableComponent } from '../../../../shared/design-system/components/table/editable-table/editable-table';
import { TableCellDirective } from '../../../../shared/design-system/components/table/table-cell.directive';
import {
  ColumnDef, EditableColumnDef, RowAction, PaginatorConfig, SortEvent, PageEvent,
} from '../../../../shared/design-system/components/table/table.models';

interface CaseRow {
  id: string;
  client: string;
  type: string;
  status: 'active' | 'pending' | 'closed';
  attorney: string;
  createdAt: string;
}

interface ContactRow {
  id: string;
  name: string;
  phone: string;
  role: string;
  budget: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  host: { class: 'flex flex-col flex-1 overflow-auto p-4 lg:p-6' },
  imports: [
    DecimalPipe,
    DropdownComponent, RichTextEditorComponent, ProgressComponent,
    SearchBarComponent, ButtonComponent,
    DataTableComponent, EditableTableComponent, TableCellDirective,
  ],
  providers: [provideIcons({
    heroArrowLeft, heroRocketLaunch, heroDocumentText,
    heroPencilSquare, heroStar, heroTrash, heroCheckCircle,
    heroArrowDownTray, heroArrowPath,
  })],
})
export class DashboardPage {
  protected toast = inject(ToastService);
  private clientService = inject(ClientService);
  private confirm = inject(ConfirmDialogService);

  // Ejemplo: búsqueda remota — se pasa la searchFn al config del dropdown
  protected clientSearchConfig: DropdownConfig = {
    searchFn: (query) => this.clientService.search(query),
    debounceMs: 400,
    minChars: 2,
    multiple: true,
  };

  // Ejemplo: opciones locales con múltiple y búsqueda en memoria
  protected localConfig: DropdownConfig = {
    multiple: true,
    searchable: true,
  };

  options: DropdownOption[] = [
    { label: 'Opción 1', value: 'option1' },
    { label: 'Opción 2', value: 'option2' },
    { label: 'Opción 3', value: 'option3' }
  ];

  // ── Search bar: ejemplo 1 — búsqueda remota con debounce ────
  protected searchResults  = signal<DropdownOption[]>([]);
  protected searchLoading  = signal(false);
  protected searchQuery    = signal('');

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
    if (!query) { this.searchResults.set([]); return; }

    this.searchLoading.set(true);
    this.clientService.search(query).subscribe({
      next:  results => { this.searchResults.set(results); this.searchLoading.set(false); },
      error: ()      => this.searchLoading.set(false),
    });
  }

  // ── Search bar: ejemplo 2 — two-way binding + filtrado local ─
  protected twoWayQuery   = signal('');
  protected filteredLocal = computed(() =>
    this.options.filter(o =>
      o.label.toLowerCase().includes(this.twoWayQuery().toLowerCase())
    )
  );

  // ── Search bar: ejemplo 3 — con handler de clear ─────────────
  protected clearResults  = signal<DropdownOption[]>([]);
  protected clearLoading  = signal(false);

  protected onSearchWithClear(query: string): void {
    if (!query) { this.clearResults.set([]); return; }
    this.clearLoading.set(true);
    this.clientService.search(query).subscribe({
      next:  results => { this.clearResults.set(results); this.clearLoading.set(false); },
      error: ()      => this.clearLoading.set(false),
    });
  }

  protected loadAll(): void {
    this.clearResults.set([]);
    this.toast.info('Resultados limpiados');
  }
  // ─────────────────────────────────────────────────────────────

  protected onOptionSelected(value: string | null): void {
    console.log('Seleccionado:', value);
  }

  // ── Ejemplos botones ─────────────────────────────────────────
  protected isSaving = signal(false);

  protected async onSave(): Promise<void> {
    this.isSaving.set(true);
    await new Promise(r => setTimeout(r, 1500)); // simula llamada HTTP
    this.isSaving.set(false);
    this.toast.success('Registro guardado correctamente', { title: 'Guardado' });
  }
  // ─────────────────────────────────────────────────────────────

  protected onDiscard(): void {
    this.toast.info('Cambios descartados');
  }

  protected onRetry(): void {
    this.toast.info('Reintentando subida...', { duration: 2000 });
  }

  protected setPosition(position: Parameters<typeof this.toast.configure>[0]['position']): void {
    this.toast.configure({ position });
    this.toast.success(`Posición cambiada a ${position}`, { duration: 2000 });
  }

  // ── data-table example ───────────────────────────────────────
  protected caseColumns: ColumnDef<CaseRow>[] = [
    { key: 'client',    header: 'Cliente',    sortable: true },
    { key: 'type',      header: 'Tipo',       sortable: true },
    { key: 'status',    header: 'Estado',     align: 'center' },
    { key: 'attorney',  header: 'Abogado',    sortable: true },
    { key: 'createdAt', header: 'Fecha',      sortable: true, align: 'right' },
  ];

  private allCases: CaseRow[] = [
    { id: '1', client: 'Empresa Alpha S.A.',    type: 'Laboral',    status: 'active',  attorney: 'María García',  createdAt: '2025-01-15' },
    { id: '2', client: 'Juan Pérez',            type: 'Civil',      status: 'pending', attorney: 'Carlos López',  createdAt: '2025-02-03' },
    { id: '3', client: 'Tech Solutions Ltda.',  type: 'Comercial',  status: 'closed',  attorney: 'Ana Martínez',  createdAt: '2025-02-18' },
    { id: '4', client: 'Rosa Mendez',           type: 'Familiar',   status: 'active',  attorney: 'María García',  createdAt: '2025-03-01' },
    { id: '5', client: 'Inversiones Del Sur',   type: 'Comercial',  status: 'pending', attorney: 'Carlos López',  createdAt: '2025-03-10' },
    { id: '6', client: 'Luis Herrera',          type: 'Penal',      status: 'active',  attorney: 'Ana Martínez',  createdAt: '2025-03-14' },
    { id: '7', client: 'Grupo Norteño Inc.',    type: 'Laboral',    status: 'closed',  attorney: 'Carlos López',  createdAt: '2025-03-20' },
  ];

  protected casePaginator = signal<PaginatorConfig>({ page: 1, pageSize: 4, total: 7 });

  protected get pagedCases(): CaseRow[] {
    const { page, pageSize } = this.casePaginator();
    return this.sortedCases.slice((page - 1) * pageSize, page * pageSize);
  }

  protected caseActions: RowAction<CaseRow>[] = [
    {
      label: 'Editar', icon: 'heroPencil', color: 'primary',
      action: (_row) => {},
    },
    {
      label: 'Eliminar', icon: 'heroTrash', color: 'danger',
      action: (row) => {
        this.allCases = this.allCases.filter(c => c.id !== row.id);
        this.casePaginator.update(p => ({ ...p, total: this.allCases.length, page: 1 }));
        this.caseSort.set(this.caseSort()); // trigger re-render
      },
      visible: (row) => row.status !== 'closed',
    },
  ];

  protected caseSelection = signal<CaseRow[]>([]);
  protected caseSort = signal<SortEvent | null>(null);

  protected get sortedCases(): CaseRow[] {
    const sort = this.caseSort();
    if (!sort) return [...this.allCases];
    return [...this.allCases].sort((a, b) => {
      const va = String((a as any)[sort.column] ?? '');
      const vb = String((b as any)[sort.column] ?? '');
      const cmp = va.localeCompare(vb);
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }

  protected onCaseSort(event: SortEvent): void {
    this.caseSort.set(event);
    this.casePaginator.update(p => ({ ...p, page: 1 }));
  }

  protected onCasePage(event: PageEvent): void {
    this.casePaginator.update(p => ({ ...p, page: event.page, pageSize: event.pageSize }));
  }

  protected statusLabel(status: CaseRow['status']): string {
    return { active: 'Activo', pending: 'Pendiente', closed: 'Cerrado' }[status];
  }

  protected statusCls(status: CaseRow['status']): string {
    return {
      active:  'bg-green-100 text-green-700',
      pending: 'bg-amber-100 text-amber-700',
      closed:  'bg-gray-100 text-gray-500',
    }[status];
  }

  // ── editable-table example ────────────────────────────────────
  protected contactColumns: EditableColumnDef<ContactRow>[] = [
    { key: 'name',   header: 'Nombre',    editable: true, type: 'text' },
    { key: 'phone',  header: 'Teléfono',  editable: true, type: 'text' },
    { key: 'role',   header: 'Rol',       editable: true, type: 'select',
      options: [
        { label: 'Abogado',    value: 'Abogado' },
        { label: 'Asistente',  value: 'Asistente' },
        { label: 'Paralegal',  value: 'Paralegal' },
      ],
    },
    { key: 'budget', header: 'Honorarios', editable: true, type: 'number', align: 'right' },
  ];

  protected contacts = signal<ContactRow[]>([
    { id: '1', name: 'Laura Soto',    phone: '+56 9 1234 5678', role: 'Abogado',   budget: 1500000 },
    { id: '2', name: 'Pedro Ríos',    phone: '+56 9 8765 4321', role: 'Paralegal', budget: 800000  },
    { id: '3', name: 'Camila Vega',   phone: '+56 9 5555 0000', role: 'Asistente', budget: 600000  },
  ]);

  protected onContactsSave(updated: ContactRow[]): void {
    this.contacts.set(updated);
  }
  // ─────────────────────────────────────────────────────────────

  async onDelete(): Promise<void> {
    const ok = await this.confirm.open({
      title: 'Delete record',
      message: 'This will permanently remove the record.<br>Cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (ok) {
      // proceed with deletion
    }
  }
}
