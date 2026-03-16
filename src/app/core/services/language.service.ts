import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLang = 'en' | 'es';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly STORAGE_KEY = 'app_lang';

  readonly current = signal<AppLang>(this.getSaved());

  constructor(private translate: TranslateService) {
    this.translate.use(this.current());
  }

  set(lang: AppLang): void {
    this.current.set(lang);
    this.translate.use(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
  }

  private getSaved(): AppLang {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved === 'es' ? 'es' : 'en';
  }
}
