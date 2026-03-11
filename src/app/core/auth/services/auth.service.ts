import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthState, LoginCredentials, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  private _state = signal<AuthState>(this.resolveInitialState());

  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly token = computed(() => this._state().token);

  constructor(private router: Router) {
    this.setupTabCloseCleanup();
  }

  login(credentials: LoginCredentials): void {
    // Reemplazar con llamada HTTP real — ver interceptor JWT
    const mockUser: User = {
      id: '1',
      name: 'Admin',
      email: credentials.email,
      role: 'admin',
    };
    const mockToken = 'mock-jwt-token';
    const mockRefresh = 'mock-refresh-token';
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8 horas

    this.persistTokens(mockToken, mockRefresh, expiresAt);
    this._state.set({ user: mockUser, token: mockToken, isAuthenticated: true });
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.clearTokens();
    this._state.set({ user: null, token: null, isAuthenticated: false });
    this.router.navigate(['/login']);
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
    // sessionStorage: se limpia al cerrar el tab
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

  private setupTabCloseCleanup(): void {
    window.addEventListener('beforeunload', () => {
      // Solo limpiar si no hay remember me (se puede extender en el futuro)
    });
  }
}
