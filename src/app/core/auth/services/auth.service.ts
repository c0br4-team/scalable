import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, from, map, switchMap, tap } from 'rxjs';
import {
  AuthState,
  LoginCredentials,
  LoginResponse,
  OtpSetupResponse,
  OtpVerificationResponse,
  User,
} from '../models/user.model';
import { NavItem } from '../../navigation/nav-item.model';
import { environment } from '../../../../environments/environment';
import { AppwriteService } from './appwrite.service';

const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    type: 'group',
    label: 'NAV.MANAGEMENT',
    children: [
      { type: 'basic', label: 'NAV.DASHBOARD', path: '/dashboard', icon: 'heroHome' },
      { type: 'basic', label: 'NAV.CASES', path: '/cases', icon: 'heroDocumentText' },
      { type: 'basic', label: 'NAV.CALENDAR', path: '/calendar', icon: 'heroCalendar' },
      {
        type: 'collapsible',
        label: 'NAV.LEADS',
        icon: 'heroIdentification',
        children: [
          { type: 'basic', label: 'NAV.LEADS_IMPORTED', path: '/leads/imported', icon: 'heroListBullet', exactPath: true },
          { type: 'basic', label: 'NAV.LEADS_MANUAL', path: '/leads/manual', icon: 'heroFolder', exactPath: true },
          { type: 'basic', label: 'NAV.LEADS_NEW', path: '/leads/new', icon: 'heroPlusCircle' },
        ],
      },
    ],
  },
  { type: 'divider' },
  {
    type: 'group',
    label: 'NAV.ADMIN',
    children: [
      { type: 'basic', label: 'NAV.USERS', path: '/users', icon: 'heroUsers' },
      { type: 'basic', label: 'NAV.SETTINGS', path: '/profile', icon: 'heroCog6Tooth' },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private appwrite = inject(AppwriteService);

  private readonly apiUrl = environment.apiUrl;
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly NAV_ITEMS_KEY = 'nav_items';
  private readonly USER_KEY = 'auth_user';

  private pendingJwt: string | null = null;
  private _state = signal<AuthState>({ user: null, token: null, isAuthenticated: false, navItems: [] });

  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly token = computed(() => this._state().token);
  readonly navItems = computed(() => this._state().navItems);
  readonly preferences = computed(() => this._state().user?.preferences ?? null);

  readonly avatarPreview = signal<string | null>(null);
  readonly currentAvatarUrl = computed(() => this.avatarPreview() ?? this._state().user?.avatarUrl ?? null);

  async initializeSession(): Promise<void> {
    const storedToken = sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (!storedToken) return;

    const account = await this.appwrite.getAccount();
    if (!account) {
      this.clearSession();
      return;
    }

    const freshJwt = await this.appwrite.createJWT().catch(() => null);
    if (!freshJwt) {
      this.clearSession();
      return;
    }

    const user = this.restoreUser();
    if (!user) {
      this.clearSession();
      return;
    }

    this.persistToken(freshJwt);

    const restoredNavItems = this.normalizeNavItems(this.restoreNavItems());
    const cachedNavItems = restoredNavItems.length ? restoredNavItems : DEFAULT_NAV_ITEMS;
    this._state.set({ user, token: freshJwt, isAuthenticated: true, navItems: cachedNavItems });

    const freshNavItems = await firstValueFrom(
      this.http.get<NavItem[]>(`${this.apiUrl}/auth/nav-items`, {
        headers: { Authorization: `Bearer ${freshJwt}` },
      })
    ).catch(() => null);

    if (freshNavItems) {
      const normalized = this.normalizeNavItems(freshNavItems);
      this.persistNavItems(normalized);
      this._state.update(s => ({ ...s, navItems: normalized }));
    }
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return from(this.appwrite.createSession(credentials.email, credentials.password)).pipe(
      switchMap(() => from(this.appwrite.createJWT())),
      switchMap(jwt =>
        this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, null, {
          headers: { Authorization: `Bearer ${jwt}` },
        }).pipe(
          tap(response => {
            if (response.otpRequired) {
              this.pendingJwt = jwt;
              return;
            }

            if (!response.user || !response.navItems) {
              throw new Error('Missing authenticated session payload.');
            }

            this.finalizeAuthenticatedSession(jwt, response.user, response.navItems);
          })
        )
      )
    );
  }

  validateLoginOtp(pendingToken: string, code: string): Observable<void> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/otp/validate-login`, { pendingToken, code }).pipe(
      tap(response => {
        if (!this.pendingJwt || !response.user || !response.navItems) {
          throw new Error('OTP login state expired.');
        }

        this.finalizeAuthenticatedSession(this.pendingJwt, response.user, response.navItems);
        this.pendingJwt = null;
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
    if (!this.pendingJwt) {
      return new Observable(obs => obs.error(new Error('OTP setup state expired.')));
    }

    const jwt = this.pendingJwt;

    return this.completeOtpSetup(code).pipe(
      switchMap(() => this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, null, {
        headers: { Authorization: `Bearer ${jwt}` },
      })),
      switchMap(response => {
        if (!response.pendingToken) {
          throw new Error('OTP challenge was not generated.');
        }

        return this.http.post<LoginResponse>(`${this.apiUrl}/auth/otp/validate-login`, {
          pendingToken: response.pendingToken,
          code,
        });
      }),
      tap(response => {
        if (!response.user || !response.navItems) {
          throw new Error('OTP session payload missing.');
        }

        this.finalizeAuthenticatedSession(jwt, response.user, response.navItems);
        this.pendingJwt = null;
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

  requestPasswordRecovery(email: string): Promise<void> {
    return this.appwrite.sendPasswordRecovery(email, `${environment.appwrite.url}reset-password`);
  }

  changePassword(currentPassword: string, newPassword: string, otpCode: string): Observable<void> {
    return this.verifyOtpCode(otpCode).pipe(
      switchMap(() => from(this.appwrite.updatePassword(newPassword, currentPassword))),
      map(() => void 0)
    );
  }

  updateToken(jwt: string): void {
    this.persistToken(jwt);
    this._state.update(s => ({ ...s, token: jwt }));
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

    return this.http.patch<{ avatarUrl?: string }>(`${this.apiUrl}/users/${userId}/avatar`, form).pipe(
      tap(updatedUser => {
        this._state.update(s => ({
          ...s,
          user: s.user ? { ...s.user, avatarUrl: updatedUser.avatarUrl } : s.user,
        }));

        this.avatarPreview.set(null);
        if (this._state().user) {
          this.persistUser(this._state().user!);
        }
      }),
      map(() => void 0)
    );
  }

  logout(): void {
    this.pendingJwt = null;
    this.appwrite.deleteSession().catch(() => {});
    this.clearSession();
    this._state.set({ user: null, token: null, isAuthenticated: false, navItems: [] });
    this.router.navigate(['/login']);
  }

  private finalizeAuthenticatedSession(jwt: string, user: User, navItems: NavItem[]): void {
    const normalizedNavItems = this.normalizeNavItems(navItems);
    this.persistToken(jwt);
    this.persistNavItems(normalizedNavItems);
    this.persistUser(user);
    this._state.set({ user, token: jwt, isAuthenticated: true, navItems: normalizedNavItems });
    this.router.navigate(['/dashboard']);
  }

  private normalizeNavItems(navItems: NavItem[]): NavItem[] {
    return navItems.map(item => {
      if (item.type !== 'group') {
        return item;
      }

      return {
        ...item,
        children: item.children.map(child => {
          if (child.type !== 'collapsible' || child.label !== 'NAV.LEADS') {
            return child;
          }

          const createChild = child.children.find(c => c.path === '/leads/new') ?? {
            type: 'basic' as const,
            label: 'NAV.LEADS_NEW',
            path: '/leads/new',
            icon: 'heroPlusCircle',
          };

          return {
            ...child,
            children: [
              { type: 'basic' as const, label: 'NAV.LEADS_IMPORTED', path: '/leads/imported', icon: 'heroListBullet', exactPath: true },
              { type: 'basic' as const, label: 'NAV.LEADS_MANUAL', path: '/leads/manual', icon: 'heroFolder', exactPath: true },
              { ...createChild, label: 'NAV.LEADS_NEW', path: '/leads/new', icon: createChild.icon ?? 'heroPlusCircle' },
            ],
          };
        }),
      };
    });
  }

  private getOtpRequestOptions(): { headers?: { Authorization: string } } {
    const jwt = this.token() ?? this.pendingJwt;
    return jwt ? { headers: { Authorization: `Bearer ${jwt}` } } : {};
  }

  private persistToken(token: string): void {
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  private persistNavItems(navItems: NavItem[]): void {
    sessionStorage.setItem(this.NAV_ITEMS_KEY, JSON.stringify(navItems));
  }

  private persistUser(user: User): void {
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private restoreNavItems(): NavItem[] {
    try {
      const raw = sessionStorage.getItem(this.NAV_ITEMS_KEY);
      return raw ? (JSON.parse(raw) as NavItem[]) : [];
    } catch {
      return [];
    }
  }

  private restoreUser(): User | null {
    try {
      const raw = sessionStorage.getItem(this.USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    [this.ACCESS_TOKEN_KEY, this.NAV_ITEMS_KEY, this.USER_KEY].forEach(key => {
      sessionStorage.removeItem(key);
    });
  }
}
