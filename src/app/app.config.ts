import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { provideIcons } from '@ng-icons/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
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
} from '@ng-icons/heroicons/outline';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([jwtInterceptor, loadingInterceptor])
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideTranslateService({ lang: 'en' }),
    provideTranslateHttpLoader(),
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
    })
  ]
};
