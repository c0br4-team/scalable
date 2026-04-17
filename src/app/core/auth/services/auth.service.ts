import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, from, switchMap, tap, map } from 'rxjs';
import { AuthState, LoginCredentials, LoginResponse, User } from '../models/user.model';
import { NavItem } from '../../navigation/nav-item.model';
import { environment } from '../../../../environments/environment';
import { AppwriteService } from './appwrite.service';


const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    type: 'group',
    label: 'NAV.MANAGEMENT',
    children: [
      { type: 'basic', label: 'NAV.DASHBOARD',  path: '/dashboard', icon: 'heroHome' },
      { type: 'basic', label: 'NAV.CASES',      path: '/cases',     icon: 'heroDocumentText' },
      { type: 'basic', label: 'NAV.CALENDAR',   path: '/calendar',  icon: 'heroCalendar' },
    ],
  },
  { type: 'divider' },
  {
    type: 'group',
    label: 'NAV.ADMIN',
    children: [
      { type: 'basic', label: 'NAV.USERS',    path: '/users',   icon: 'heroUsers' },
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

  private _state = signal<AuthState>({ user: null, token: null, isAuthenticated: false, navItems: [] });

  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly token = computed(() => this._state().token);
  readonly navItems = computed(() => this._state().navItems);
  readonly preferences = computed(() => this._state().user?.preferences ?? null);

  /** Preview local (base64) del avatar durante la subida — compartido en toda la app. */
  readonly avatarPreview = signal<string | null>(null);

  /** URL efectiva del avatar: preview local durante la subida, URL de Appwrite una vez guardada. */
  readonly currentAvatarUrl = computed(() =>
    this.avatarPreview() ?? this._state().user?.avatarUrl ?? null
  );

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
    const navItems = this.restoreNavItems().length ? this.restoreNavItems() : DEFAULT_NAV_ITEMS;

    if (!user) {
      this.clearSession();
      return;
    }

    this.persistToken(freshJwt);
    this._state.set({ user, token: freshJwt, isAuthenticated: true, navItems });
  }

  login(credentials: LoginCredentials): Observable<void> {
    return from(this.appwrite.createSession(credentials.email, credentials.password)).pipe(
      switchMap(() => from(this.appwrite.createJWT())),
      switchMap(jwt =>
        this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, null, {
          headers: { Authorization: `Bearer ${jwt}` },
        }).pipe(
          tap(({ user, navItems }) => {
            this.persistToken(jwt);
            this.persistNavItems(navItems);
            this.persistUser(user);
            this._state.set({ user, token: jwt, isAuthenticated: true, navItems });
            this.router.navigate(['/dashboard']);
          }),
        )
      ),
      map(() => void 0),
    );
  }

  updateToken(jwt: string): void {
    this.persistToken(jwt);
    this._state.update(s => ({ ...s, token: jwt }));
  }

  /**
   * Sube una nueva foto de perfil.
   * Valida tipo y tamaño en el cliente, luego envía al backend vía multipart/form-data.
   * El backend sube el archivo a Appwrite Storage, guarda la URL y devuelve el UserDto actualizado.
   */
  uploadAvatar(file: File): Observable<void> {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_SIZE_MB = 5;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Observable(obs => {
        obs.error(new Error('Tipo de archivo no permitido. Solo se aceptan JPEG, PNG o WebP.'));
      });
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return new Observable(obs => {
        obs.error(new Error(`El archivo supera el límite de ${MAX_SIZE_MB} MB.`));
      });
    }

    const form = new FormData();
    form.append('file', file, file.name);

    const userId = this._state().user?.id;
    if (!userId) {
      return new Observable(obs => obs.error(new Error('No hay sesión activa.')));
    }

    return this.http.patch<{ id: string; name: string; email: string; role: string; phone?: string; avatarUrl?: string; preferences: { language: string; theme: string } }>(
      `${this.apiUrl}/users/${userId}/avatar`,
      form
    ).pipe(
      tap(updatedUser => {
        const mapped = updatedUser as typeof updatedUser;
        this._state.update(s => ({
          ...s,
          user: s.user ? { ...s.user, avatarUrl: mapped.avatarUrl } : s.user,
        }));
        this.avatarPreview.set(null); // la URL real ya está en user.avatarUrl
        if (this._state().user) {
          this.persistUser(this._state().user!);
        }
      }),
      map(() => void 0),
    );
  }

  logout(): void {
    this.appwrite.deleteSession().catch(() => {});
    this.clearSession();
    this._state.set({ user: null, token: null, isAuthenticated: false, navItems: [] });
    this.router.navigate(['/login']);
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
