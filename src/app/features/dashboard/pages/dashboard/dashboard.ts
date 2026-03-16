import { Component, inject } from '@angular/core';
import { ToastService } from '../../../../core/notifications/toast.service';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  host: { class: 'flex flex-col flex-1 overflow-auto p-4 lg:p-6' },
  imports: [DropdownComponent]
})
export class DashboardPage {
  protected toast = inject(ToastService);

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
