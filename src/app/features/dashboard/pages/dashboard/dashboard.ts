import { Component, inject } from '@angular/core';
import { ToastService } from '../../../../core/notifications/toast.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>

      <!-- Tipos básicos -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tipos básicos</h2>
        <div class="flex flex-wrap gap-2">
          <button (click)="toast.success('Caso guardado correctamente')"
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
            Success
          </button>
          <button (click)="toast.error('No se pudo conectar al servidor')"
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
            Error
          </button>
          <button (click)="toast.warning('Cambios pendientes sin guardar')"
            class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors">
            Warning
          </button>
          <button (click)="toast.info('Sincronizando datos...')"
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            Info
          </button>
        </div>
      </div>

      <!-- Con título -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Con título</h2>
        <div class="flex flex-wrap gap-2">
          <button (click)="toast.success('El registro fue enviado al flujo de aprobación.', { title: 'Caso creado' })"
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
            Success + título
          </button>
          <button (click)="toast.error('El token ha expirado. Por favor inicia sesión nuevamente.', { title: 'Sesión expirada' })"
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
            Error + título
          </button>
        </div>
      </div>

      <!-- Con acción -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Con acción</h2>
        <div class="flex flex-wrap gap-2">
          <button (click)="toast.warning('Tienes cambios sin guardar en el formulario.', {
            title: 'Atención',
            action: { label: 'Descartar cambios', onClick: onDiscard.bind(this) }
          })"
            class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors">
            Warning + acción
          </button>
          <button (click)="toast.error('No se pudo guardar el archivo adjunto.', {
            title: 'Error al subir',
            action: { label: 'Reintentar', onClick: onRetry.bind(this) }
          })"
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
            Error + acción
          </button>
        </div>
      </div>

      <!-- Duración personalizada y persistente -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Duración y persistencia</h2>
        <div class="flex flex-wrap gap-2">
          <button (click)="toast.success('Este mensaje desaparece en 1 segundo', { duration: 1000 })"
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
            1 segundo
          </button>
          <button (click)="toast.info('Procesando archivo grande...', { title: 'En progreso', duration: 0, dismissible: false, progress: false })"
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            Persistente
          </button>
          <button (click)="toast.dismissAll()"
            class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
            Cerrar todos
          </button>
        </div>
      </div>

      <!-- Posición -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Posición</h2>
        <div class="flex flex-wrap gap-2">
          <button (click)="setPosition('top-right')"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            Top Right
          </button>
          <button (click)="setPosition('top-center')"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            Top Center
          </button>
          <button (click)="setPosition('top-left')"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            Top Left
          </button>
          <button (click)="setPosition('bottom-right')"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            Bottom Right
          </button>
          <button (click)="setPosition('bottom-center')"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            Bottom Center
          </button>
          <button (click)="setPosition('bottom-left')"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            Bottom Left
          </button>
        </div>
        <p class="text-xs text-gray-400">Posición actual: <strong>{{ toast.config().position }}</strong></p>
      </div>

    </div>
  `,
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
