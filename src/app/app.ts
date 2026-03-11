import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './shared/ui/spinner/spinner';
import { ToastComponent } from './shared/ui/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpinnerComponent, ToastComponent],
  template: `
    <router-outlet />
    <app-spinner />
    <app-toast />
  `,
})
export class App { }
