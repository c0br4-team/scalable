import { NavItem } from '../../navigation/nav-item.model';

export interface UserPreferences {
  language: 'en' | 'es';
  theme: 'light' | 'dark';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  preferences: UserPreferences;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  navItems: NavItem[];
}
