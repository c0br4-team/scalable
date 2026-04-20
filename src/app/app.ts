import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './shared/ui/spinner/spinner';
import { ToastComponent } from './shared/ui/toast/toast';
import { LanguageService } from './core/services/language.service';
import { SplashScreenComponent } from './shared/design-system/components/splash-screen/splash-screen.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpinnerComponent, ToastComponent, SplashScreenComponent],
  template: `
    <sce-splash-screen />
    <router-outlet />
    <app-spinner />
    <app-toast />
  `,
})
export class App {
  constructor() { inject(LanguageService); }
}
