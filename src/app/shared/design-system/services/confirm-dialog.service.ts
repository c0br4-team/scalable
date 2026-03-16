import { Injectable, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { ConfirmDialogComponent, ConfirmDialogOptions } from '../components/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector,
  ) { }

  /**
   * Opens a confirmation dialog and resolves to `true` if the user confirms,
   * or `false` if they cancel / click the backdrop / press Escape.
   */
  open(options: ConfirmDialogOptions = {}): Promise<boolean> {
    return new Promise(resolve => {
      const ref = createComponent(ConfirmDialogComponent, {
        environmentInjector: this.injector,
      });

      ref.setInput('title', options.title ?? 'Are you sure?');
      ref.setInput('message', options.message ?? 'This action cannot be undone.');
      ref.setInput('confirmLabel', options.confirmLabel ?? 'Confirm');
      ref.setInput('cancelLabel', options.cancelLabel ?? 'Cancel');

      this.appRef.attachView(ref.hostView);
      document.body.appendChild(ref.location.nativeElement);

      const close = (result: boolean): void => {
        resolve(result);
        this.appRef.detachView(ref.hostView);
        ref.destroy();
      };

      ref.instance.confirmed.subscribe(() => close(true));
      ref.instance.cancelled.subscribe(() => close(false));
    });
  }
}
