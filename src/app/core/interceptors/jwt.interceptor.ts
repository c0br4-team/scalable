import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { AppwriteService } from '../auth/services/appwrite.service';

const attachToken = (req: HttpRequest<unknown>, token: string) =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

const handleRequest = (req: HttpRequest<unknown>, next: HttpHandlerFn, token: string | null, auth: AuthService, appwrite: AppwriteService) => {
  const authReq = token ? attachToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) return throwError(() => error);

      return from(appwrite.createJWT()).pipe(
        switchMap(freshJwt => {
          auth.updateToken(freshJwt);
          return next(attachToken(req, freshJwt));
        }),
        catchError(() => {
          auth.logout();
          return throwError(() => error);
        }),
      );
    }),
  );
};

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const appwrite = inject(AppwriteService);
  return handleRequest(req, next, auth.token(), auth, appwrite);
};
