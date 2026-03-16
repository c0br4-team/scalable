import { Component, input, output } from '@angular/core';

export interface ConfirmDialogOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  selector: 'sce-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  title        = input('Are you sure?');
  message      = input('This action cannot be undone.');
  confirmLabel = input('Confirm');
  cancelLabel  = input('Cancel');

  confirmed = output<void>();
  cancelled = output<void>();
}
