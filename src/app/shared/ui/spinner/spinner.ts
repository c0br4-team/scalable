import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/http/services/loading.service';

@Component({
  selector: 'app-spinner',
  template: `
    @if (loading.isLoading()) {
      <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
        <div class="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-3">
          <svg class="w-10 h-10 animate-spin text-[#1e3a5f]" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <span class="text-sm text-gray-500 font-medium">Cargando...</span>
        </div>
      </div>
    }
  `,
})
export class SpinnerComponent {
  protected loading = inject(LoadingService);
}
