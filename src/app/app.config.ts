import { ApplicationConfig, inject, isDevMode, LOCALE_ID, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { AuthService } from './core/auth/services/auth.service';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { provideIcons } from '@ng-icons/core';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { SplashScreenService } from './shared/design-system/services/splash-screen.service';
import { LanguageService } from './core/services/language.service';
import { firstValueFrom } from 'rxjs';
import {
  heroHome,
  heroDocumentText,
  heroUsers,
  heroCog6Tooth,
  heroChartBar,
  heroArrowRightOnRectangle,
  heroChevronDown,
  heroBars3,
  heroEye,
  heroEyeSlash,
  heroXMark,
  heroCheckCircle,
  heroExclamationCircle,
  heroExclamationTriangle,
  heroInformationCircle,
  heroChevronRight,
  heroChevronLeft,
  heroChevronUp,
  heroChevronDoubleLeft,
  heroChevronDoubleRight,
  heroCalendar,
  heroTag,
  heroUserPlus,
  heroTrash,
  heroPlus,
  heroArrowUpTray,
  heroDocument,
  heroPhoto,
  heroPaperClip,
  heroClock,
  heroPencil,
  heroCheck,
  heroArrowPath,
  heroFunnel,
  heroMagnifyingGlass,
  heroUserCircle,
  heroArrowLeft,
  heroArrowTopRightOnSquare,
  heroChatBubbleLeftEllipsis,
  heroFolder,
  heroFolderOpen,
  heroArrowDownTray,
  heroArrowRight,
  heroCursorArrowRays,
  heroArrowsPointingIn,
  heroIdentification,
  heroListBullet,
  heroPlusCircle
} from '@ng-icons/heroicons/outline';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeEn from '@angular/common/locales/en';

registerLocaleData(localeEs, 'es');
registerLocaleData(localeEn, 'en');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(async () => {
      const auth = inject(AuthService);
      const splash = inject(SplashScreenService);
      const langService = inject(LanguageService);
      const translate = inject(TranslateService);
      await Promise.all([
        auth.initializeSession(),
        firstValueFrom(translate.use(langService.current())),
      ]);
      splash.hide();
    }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([jwtInterceptor, loadingInterceptor])
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideTranslateService(),
    provideTranslateHttpLoader({ useHttpBackend: true }),
    {
      provide: LOCALE_ID,
      useFactory: () => {
        const lang = localStorage.getItem('app_lang') || 'en';
        return lang;
      }
    },
    provideIcons({
      heroHome,
      heroDocumentText,
      heroUsers,
      heroCog6Tooth,
      heroChartBar,
      heroArrowRightOnRectangle,
      heroChevronDown,
      heroBars3,
      heroEye,
      heroEyeSlash,
      heroXMark,
      heroCheckCircle,
      heroExclamationCircle,
      heroExclamationTriangle,
      heroInformationCircle,
      heroChevronRight,
      heroChevronLeft,
      heroChevronUp,
      heroChevronDoubleLeft,
      heroChevronDoubleRight,
      heroCalendar,
      heroPlus,
      heroTrash,
      heroUserPlus,
      heroTag,
      heroArrowUpTray,
      heroDocument,
      heroPhoto,
      heroPaperClip,
      heroClock,
      heroPencil,
      heroCheck,
      heroArrowPath,
      heroFunnel,
      heroMagnifyingGlass,
      heroUserCircle,
      heroArrowLeft,
      heroArrowTopRightOnSquare,
      heroChatBubbleLeftEllipsis,
      heroFolder,
      heroFolderOpen,
      heroArrowDownTray,
      heroArrowRight,
      heroCursorArrowRays,
      heroArrowsPointingIn,
      heroIdentification,
      heroListBullet,
      heroPlusCircle
    })
  ]
};
