import { Component, computed, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  host: { class: 'flex flex-col flex-1 overflow-auto p-4 lg:p-6' },
  imports: [DropdownComponent, RichTextEditorComponent, ProgressComponent, SearchBarComponent, ButtonComponent],
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
