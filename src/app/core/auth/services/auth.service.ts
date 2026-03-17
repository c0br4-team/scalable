import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { AuthState, LoginCredentials, User } from '../models/user.model';
import { environment } from '../../../../environments/environment';

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // ms
}

interface RefreshResponse {
  accessToken: string;
  expiresIn: number; // ms
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly apiUrl = environment.apiUrl;
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  private _state = signal<AuthState>(this.resolveInitialState());

  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly token = computed(() => this._state().token);

  login(credentials: LoginCredentials): Observable<void> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(({ user, accessToken, refreshToken, expiresIn }) => {
        const expiresAt = Date.now() + expiresIn;
        this.persistTokens(accessToken, refreshToken, expiresAt);
        this._state.set({ user, token: accessToken, isAuthenticated: true });
        this.router.navigate(['/dashboard']);
      }),
      map(() => void 0),
    );
  }

  logout(): void {
    // Fire-and-forget: navegar inmediatamente, notificar al servidor en segundo plano
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({ error: () => {} });
    this.clearTokens();
    this._state.set({ user: null, token: null, isAuthenticated: false });
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<RefreshResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(({ accessToken, expiresIn }) => {
        const expiresAt = Date.now() + expiresIn;
        const storedRefresh = this.getRefreshToken() ?? '';
        this.persistTokens(accessToken, storedRefresh, expiresAt);
        this._state.update(s => ({ ...s, token: accessToken, isAuthenticated: true }));
      }),
      map(() => void 0),
    );
  }

  isTokenExpired(): boolean {
    const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY)
      ?? localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    return Date.now() > parseInt(expiry, 10);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY)
      ?? localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string, expiresInMs: number): void {
    const expiresAt = Date.now() + expiresInMs;
    this.persistTokens(accessToken, refreshToken, expiresAt);
    this._state.update(s => ({ ...s, token: accessToken, isAuthenticated: true }));
  }

  private resolveInitialState(): AuthState {
    const token = sessionStorage.getItem(this.ACCESS_TOKEN_KEY)
      ?? localStorage.getItem(this.ACCESS_TOKEN_KEY);

    if (!token) return { user: null, token: null, isAuthenticated: false };

    const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY)
      ?? localStorage.getItem(this.TOKEN_EXPIRY_KEY);

    if (expiry && Date.now() > parseInt(expiry, 10)) {
      this.clearTokens();
      return { user: null, token: null, isAuthenticated: false };
    }

    return { user: null, token, isAuthenticated: true };
  }

  private persistTokens(access: string, refresh: string, expiresAt: number): void {
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, access);
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refresh);
    sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiresAt.toString());
  }

  private clearTokens(): void {
    [this.ACCESS_TOKEN_KEY, this.REFRESH_TOKEN_KEY, this.TOKEN_EXPIRY_KEY].forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
  }
}
