import { Component, inject } from '@angular/core';
import { Toast, ToastPosition, ToastService } from '../../../core/services/toast.service';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  imports: [NgIcon, TranslatePipe],
})
export class ToastComponent {
  protected toastService = inject(ToastService);

  protected trackById(_: number, toast: Toast): number {
    return toast.id;
  }

  protected positionClasses(position: ToastPosition): string {
    const map: Record<ToastPosition, string> = {
      'top-right': 'top-4 right-4 items-end',
      'top-left': 'top-4 left-4 items-start',
      'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
      'bottom-right': 'bottom-4 right-4 items-end',
      'bottom-left': 'bottom-4 left-4 items-start',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
    };
    return map[position];
  }

  protected cardClasses(type: Toast['type']): string {
    const map: Record<Toast['type'], string> = {
      success: 'bg-white border-l-4 border-green-500 text-gray-800',
      error: 'bg-white border-l-4 border-red-500 text-gray-800',
      warning: 'bg-white border-l-4 border-amber-500 text-gray-800',
      info: 'bg-white border-l-4 border-blue-500 text-gray-800',
    };
    return map[type];
  }

  protected progressClasses(type: Toast['type']): string {
    const map: Record<Toast['type'], string> = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-amber-500',
      info: 'bg-blue-500',
    };
    return map[type];
  }

  protected iconClasses(type: Toast['type']): string {
    const map: Record<Toast['type'], string> = {
      success: '!text-green-500',
      error: '!text-red-500',
      warning: '!text-amber-500',
      info: '!text-blue-500',
    };
    return map[type];
  }

  protected toastIconName(type: Toast['type']): string {
    const map: Record<Toast['type'], string> = {
      success: 'heroCheckCircle',
      error: 'heroExclamationCircle',
      warning: 'heroExclamationTriangle',
      info: 'heroInformationCircle',
    };
    return map[type];
  }

  protected progressDuration(toast: Toast): string {
    return `${toast.duration}ms`;
  }
}
