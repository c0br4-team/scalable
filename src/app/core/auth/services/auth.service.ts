import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, from, switchMap, tap, map } from 'rxjs';
import { AuthState, LoginCredentials, User } from '../models/user.model';
import { NavItem } from '../../navigation/nav-item.model';
import { environment } from '../../../../environments/environment';
import { AppwriteService } from './appwrite.service';

interface LoginResponse {
  user: User;
  navItems: NavItem[];
}

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
    const navItems = this.restoreNavItems();

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
