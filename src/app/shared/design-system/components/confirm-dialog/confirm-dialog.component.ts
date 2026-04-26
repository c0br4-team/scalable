import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export type ConfirmDialogVariant = 'primary' | 'danger';

export interface ConfirmDialogOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
}

@Component({
  selector: 'sce-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  title        = input('Are you sure?');
  message      = input('This action cannot be undone.');
  confirmLabel = input('Confirm');
  cancelLabel  = input('Cancel');
  variant      = input<ConfirmDialogVariant>('primary');

  protected readonly iconContainerClass = computed(() => this.variant() === 'danger'
    ? 'flex items-center justify-center p-4 bg-red-100 rounded-full'
    : 'flex items-center justify-center p-4 bg-blue-100 rounded-full');

  protected readonly confirmButtonClass = computed(() => this.variant() === 'danger'
    ? 'w-full md:w-36 h-10 rounded-md text-white bg-red-600 font-medium text-sm hover:bg-red-700 active:scale-95 transition'
    : 'w-full md:w-36 h-10 rounded-md text-white bg-blue-600 font-medium text-sm hover:bg-blue-700 active:scale-95 transition');

  confirmed = output<void>();
  cancelled = output<void>();
}
