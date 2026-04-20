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
  avatarUrl?: string;
  preferences: UserPreferences;
  otpEnabled?: boolean;
  otpConfigured?: boolean;
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

export interface LoginResponse {
  user: User | null;
  navItems: NavItem[] | null;
  otpRequired: boolean;
  pendingToken?: string | null;
  otpSetupRequired?: boolean;
}

export interface OtpSetupResponse {
  otpRequired: boolean;
  otpConfigured: boolean;
  manualEntryKey?: string | null;
  otpAuthUri?: string | null;
  qrCodeDataUrl?: string | null;
  email: string;
  digits: number;
  issuer: string;
}

export interface OtpVerificationResponse {
  success: boolean;
}
