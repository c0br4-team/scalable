import { Component, inject } from '@angular/core';
import { ToastService } from '../../../../core/notifications/toast.service';
import { DropdownComponent } from '../../../../shared/design-system/dropdown/dropdown.component';
import { DropdownConfig, DropdownOption } from '../../../../shared/design-system/models/components.model';
import { ClientService } from '../../../../core/http/services/client.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  host: { class: 'flex flex-col flex-1 overflow-auto p-4 lg:p-6' },
  imports: [DropdownComponent]
})
export class DashboardPage {
  protected toast = inject(ToastService);
  private clientService = inject(ClientService);

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
    { label: 'Opción 3', value: 'option3' },
    { label: 'Opción 1', value: 'option1' },
    { label: 'Opción 2', value: 'option2' },
    { label: 'Opción 3', value: 'option3' },
    { label: 'Opción 1', value: 'option1' },
    { label: 'Opción 2', value: 'option2' },
    { label: 'Opción 3', value: 'option3' },
    { label: 'Opción 1', value: 'option1' },
    { label: 'Opción 2', value: 'option2' },
    { label: 'Opción 3', value: 'option3' },
    { label: 'Opción 1', value: 'option1' },
    { label: 'Opción 2', value: 'option2' },
    { label: 'Opción 3', value: 'option3' },
    { label: 'Opción 1', value: 'option1' },
    { label: 'Opción 2', value: 'option2' },
    { label: 'Opción 3', value: 'option3' },
    { label: 'Opción 1', value: 'option1' },
    { label: 'Opción 2', value: 'option2' },
    { label: 'Opción 3', value: 'option3' },
    { label: 'Opción 1', value: 'option1' },
    { label: 'Opción 2', value: 'option2' },
    { label: 'Opción 3', value: 'option3' },
    { label: 'Opción 1', value: 'option1' },
    { label: 'Opción 2', value: 'option2' },
    { label: 'Opción 3', value: 'option3' },
    { label: 'Opción 1', value: 'option1' },
    { label: 'Opción 2', value: 'option2' },
    { label: 'Opción 3', value: 'option3' },
    { label: 'Opción 1', value: 'option1' },
    { label: 'Opción 2', value: 'option2' },
    { label: 'Opción 3', value: 'option3' },
    { label: 'Opción 1', value: 'option1' },
    { label: 'Opción 2', value: 'option2' },
    { label: 'Opción 3', value: 'option3' },
    { label: 'Opción 1', value: 'option1' },
    { label: 'Opción 2', value: 'option2' },
    { label: 'Opción 3', value: 'option3' },
  ];

  protected onOptionSelected(value: string | null): void {
    console.log('Seleccionado:', value);
  }

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
}
