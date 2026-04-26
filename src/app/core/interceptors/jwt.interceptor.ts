import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../http/services/auth.service';
import { environment } from '../../../environments/environment';

const isApiRequest = (url: string): boolean => url.startsWith(environment.apiUrl);
const isLoginRequest = (url: string): boolean => url.startsWith(`${environment.apiUrl}/auth/login`);
const isHeartbeatRequest = (url: string): boolean => url.startsWith(`${environment.apiUrl}/auth/session/heartbeat`);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const authReq = isApiRequest(req.url) ? req.clone({ withCredentials: true }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.isAuthenticated() && !isLoginRequest(req.url)) {
        auth.logout();
      }

      if (error.status === 401 && isHeartbeatRequest(req.url) && auth.isAuthenticated()) {
        auth.logout();
      }

      return throwError(() => error);
    }),
  );
};
