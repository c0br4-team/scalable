import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './shared/ui/spinner/spinner';
import { ToastComponent } from './shared/ui/toast/toast';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpinnerComponent, ToastComponent],
  template: `
    <router-outlet />
    <app-spinner />
    <app-toast />
  `,
})
export class App {
  constructor() { inject(LanguageService); }
}
