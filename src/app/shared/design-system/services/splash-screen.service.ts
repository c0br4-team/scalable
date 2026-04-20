import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SplashScreenService {
  private readonly platformId = inject(PLATFORM_ID);

  hide(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const elements = Array.from(document.querySelectorAll('sce-splash-screen')) as HTMLElement[];
    for (const el of elements) {
      if (el.classList.contains('sce-splash--hidden')) continue;

      el.classList.add('sce-splash--hidden');
      el.addEventListener('transitionend', () => el.remove(), { once: true });
      window.setTimeout(() => el.remove(), 450);
    }
  }
}
