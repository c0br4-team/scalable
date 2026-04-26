import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, forkJoin, from, map, switchMap, tap } from 'rxjs';
import {
  AuthState,
  LoginCredentials,
  LoginResponse,
  OtpSetupResponse,
  OtpVerificationResponse,
  User,
} from '../../auth/models/user.model';
import { NavItem } from '../../navigation/nav-item.model';
import { environment } from '../../../../environments/environment';
import { SKIP_GLOBAL_LOADING } from '../../interceptors/loading.interceptor';
import { SessionTrackingService } from './session-tracking.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private sessionTracking = inject(SessionTrackingService);

  private readonly apiUrl = environment.apiUrl;
  private readonly recoveryUrl = new URL('reset-password', environment.appwrite.url).toString();

  private pendingLoginToken: string | null = null;
  private pendingUserId: string | null = null;
  private _state = signal<AuthState>({ user: null, isAuthenticated: false, navItems: [] });

  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly navItems = computed(() => this._state().navItems);
  readonly preferences = computed(() => this._state().user?.preferences ?? null);
  readonly permissions = computed(() => this._state().user?.permissions ?? []);

  readonly avatarPreview = signal<string | null>(null);
  readonly currentAvatarUrl = computed(() => {
    const preview = this.avatarPreview();
    if (preview) {
      return preview;
    }

    const user = this._state().user;
    if (!user?.id || !user.hasAvatar) {
      return null;
    }

    const version = user.avatarVersion ?? 'current';
    return `${this.apiUrl}/users/${encodeURIComponent(user.id)}/avatar?v=${encodeURIComponent(version)}`;
  });

  async initializeSession(): Promise<void> {
    const [user, navItems] = await Promise.all([
      this.fetchCurrentUser(),
      this.fetchNavItems(),
    ]);

    if (!user || !navItems) {
      this.clearSession();
      return;
    }

    this.setAuthenticatedState(user, navItems);
    this.sessionTracking.start();
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return from(this.sessionTracking.buildDeviceContextAsync(true)).pipe(
      switchMap(deviceContext => this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, {
        ...credentials,
        deviceContext,
      }, this.getAuthRequestOptions())),
      tap(response => {
        if (response.otpRequired) {
          this.pendingLoginToken = response.pendingToken ?? null;
          this.pendingUserId = response.userId ?? null;
          return;
        }

        if (!response.user || !response.navItems) {
          throw new Error('Missing authenticated session payload.');
        }

        this.finalizeAuthenticatedSession(response.user, response.navItems);
      })
    );
  }

  validateLoginOtp(pendingToken: string, code: string): Observable<void> {
    return from(this.sessionTracking.buildDeviceContextAsync(true)).pipe(
      switchMap(deviceContext => this.http.post<LoginResponse>(`${this.apiUrl}/auth/otp/validate-login`, {
        pendingToken,
        code,
        deviceContext,
      }, this.getAuthRequestOptions())),
      tap(response => {
        if (!response.user || !response.navItems) {
          throw new Error('OTP login state expired.');
        }

        this.finalizeAuthenticatedSession(response.user, response.navItems);
        this.pendingLoginToken = null;
        this.pendingUserId = null;
      }),
      map(() => void 0)
    );
  }

  getOtpSetup(userId?: string): Observable<OtpSetupResponse> {
    return this.http.post<OtpSetupResponse>(
      `${this.apiUrl}/auth/otp/setup`,
      { userId: userId ?? null },
      this.getOtpRequestOptions(),
    );
  }

  completeOtpSetup(code: string, userId?: string): Observable<void> {
    return this.http.post<OtpVerificationResponse>(
      `${this.apiUrl}/auth/otp/complete-setup`,
      { userId: userId ?? null, code },
      this.getOtpRequestOptions(),
    ).pipe(map(() => void 0));
  }

  completeLoginOtpSetup(code: string): Observable<void> {
    if (!this.pendingLoginToken || !this.pendingUserId) {
      return new Observable(obs => obs.error(new Error('OTP setup state expired.')));
    }

    const pendingToken = this.pendingLoginToken;
    const pendingUserId = this.pendingUserId;

    return this.completeOtpSetup(code, pendingUserId).pipe(
      switchMap(() => from(this.sessionTracking.buildDeviceContextAsync(true))),
      switchMap(deviceContext => this.http.post<LoginResponse>(`${this.apiUrl}/auth/otp/validate-login`, {
        pendingToken,
        code,
        deviceContext,
      }, this.getAuthRequestOptions())),
      tap(response => {
        if (!response.user || !response.navItems) {
          throw new Error('OTP session payload missing.');
        }

        this.finalizeAuthenticatedSession(response.user, response.navItems);
        this.pendingLoginToken = null;
        this.pendingUserId = null;
      }),
      map(() => void 0),
    );
  }

  verifyOtpCode(code: string, userId?: string): Observable<void> {
    return this.http.post<OtpVerificationResponse>(
      `${this.apiUrl}/auth/otp/verify`,
      { userId: userId ?? null, code },
      this.getOtpRequestOptions(),
    ).pipe(map(() => void 0));
  }

  requestPasswordRecovery(email: string, recoveryUrl = this.recoveryUrl): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/password/recovery/request`, {
      email,
      url: recoveryUrl,
    }, this.getAuthRequestOptions(false)).pipe(map(() => void 0));
  }

  changePassword(currentPassword: string, newPassword: string, otpCode: string): Observable<void> {
    return this.verifyOtpCode(otpCode).pipe(
      switchMap(() => this.http.post<void>(`${this.apiUrl}/auth/password/change`, {
        currentPassword,
        newPassword,
      }, this.getAuthRequestOptions())),
      map(() => void 0)
    );
  }

  completePasswordRecovery(userId: string, secret: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/password/recovery/complete`, {
      userId,
      secret,
      newPassword,
    }, this.getAuthRequestOptions(false)).pipe(map(() => void 0));
  }

  hasPermission(permissionCode: string): boolean {
    return this.permissions().includes(permissionCode);
  }

  hasAnyPermission(permissionCodes: readonly string[]): boolean {
    return permissionCodes.some(permissionCode => this.hasPermission(permissionCode));
  }

  refreshCurrentUser(): Observable<void> {
    return forkJoin({
      user: this.http.get<User>(`${this.apiUrl}/auth/me`, this.getAuthRequestOptions()),
      navItems: this.http.get<NavItem[]>(`${this.apiUrl}/auth/nav-items`, this.getAuthRequestOptions()),
    }).pipe(
      tap(({ user, navItems }) => {
        const normalizedNavItems = this.normalizeNavItems(navItems);
        this._state.update(state => ({
          ...state,
          user,
          navItems: normalizedNavItems,
        }));
      }),
      map(() => void 0),
    );
  }

  uploadAvatar(file: File): Observable<void> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeMb = 5;

    if (!allowedTypes.includes(file.type)) {
      return new Observable(obs => {
        obs.error(new Error('Tipo de archivo no permitido. Solo se aceptan JPEG, PNG o WebP.'));
      });
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      return new Observable(obs => {
        obs.error(new Error(`El archivo supera el límite de ${maxSizeMb} MB.`));
      });
    }

    const form = new FormData();
    form.append('file', file, file.name);

    const userId = this._state().user?.id;
    if (!userId) {
      return new Observable(obs => obs.error(new Error('No hay sesión activa.')));
    }

    return this.http.patch<Pick<User, 'hasAvatar' | 'avatarVersion'>>(`${this.apiUrl}/users/${userId}/avatar`, form).pipe(
      tap(updatedUser => {
        this._state.update(s => ({
          ...s,
          user: s.user ? {
            ...s.user,
            hasAvatar: updatedUser.hasAvatar,
            avatarVersion: updatedUser.avatarVersion,
          } : s.user,
        }));

        this.avatarPreview.set(null);
      }),
      map(() => void 0)
    );
  }

  logout(): void {
    this.sessionTracking.stop(true);
    this.pendingLoginToken = null;
    this.pendingUserId = null;
    this.clearSession();
    this.http.post<void>(`${this.apiUrl}/auth/logout`, {}, this.getAuthRequestOptions()).subscribe({
      error: () => undefined,
    });
    this.router.navigate(['/login']);
  }

  private finalizeAuthenticatedSession(user: User, navItems: NavItem[]): void {
    this.setAuthenticatedState(user, navItems);
    this.sessionTracking.start();
    this.router.navigate(['/dashboard']);
  }

  private async fetchCurrentUser(): Promise<User | null> {
    return firstValueFrom(
      this.http.get<User>(`${this.apiUrl}/auth/me`, this.getAuthRequestOptions())
    ).catch(() => null);
  }

  private async fetchNavItems(): Promise<NavItem[] | null> {
    return firstValueFrom(
      this.http.get<NavItem[]>(`${this.apiUrl}/auth/nav-items`, this.getAuthRequestOptions())
    ).catch(() => null);
  }

  private setAuthenticatedState(user: User, navItems: NavItem[]): void {
    const normalizedNavItems = this.normalizeNavItems(navItems);
    this._state.set({ user, isAuthenticated: true, navItems: normalizedNavItems });
  }

  private normalizeNavItems(navItems: NavItem[]): NavItem[] {
    return navItems.map(item => {
      if (item.type !== 'group') {
        return item;
      }

      return {
        ...item,
        children: item.children.map(child => {
          if (child.type !== 'collapsible') {
            return child;
          }

          return {
            ...child,
            children: child.children.map(c => ({
              type: 'basic' as const,
              label: c.label,
              path: c.path,
              icon: c.icon,
              exactPath: c.exactPath,
            })),
          };
        }),
      };
    });
  }

  private getAuthRequestOptions(withCredentials = true): { withCredentials: boolean; context: HttpContext } {
    return {
      withCredentials,
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, true),
    };
  }

  private getOtpRequestOptions(): { withCredentials: boolean; context: HttpContext } {
    return this.getAuthRequestOptions();
  }

  private clearSession(): void {
    this.sessionTracking.stop();
    this.avatarPreview.set(null);
    this.pendingLoginToken = null;
    this.pendingUserId = null;
    this._state.set({ user: null, isAuthenticated: false, navItems: [] });
  }
}
