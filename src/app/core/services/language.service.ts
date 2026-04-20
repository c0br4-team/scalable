import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLang = 'en' | 'es';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly STORAGE_KEY = 'app_lang';

  readonly current = signal<AppLang>(this.getSaved());

  constructor(private translate: TranslateService) {
    // translate.use() is awaited in provideAppInitializer before the splash
    // screen hides, so no translation call is needed here.
  }

  set(lang: AppLang): void {
    this.current.set(lang);
    this.translate.use(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
  }

  private getSaved(): AppLang {
    // 1. Preferencia guardada en localStorage
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'es' || saved === 'en') return saved;

    // 2. Idioma del navegador
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang === 'es' || browserLang === 'en') return browserLang as AppLang;

    // 3. Fallback
    return 'en';
  }
}
