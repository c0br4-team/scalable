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
  permissions: string[];
  phone?: string;
  hasAvatar: boolean;
  avatarVersion?: string | null;
  preferences: UserPreferences;
  otpEnabled?: boolean;
  otpConfigured?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface DeviceContext {
  installationId: string | null;
  userAgent: string | null;
  platform: string | null;
  language: string | null;
  languages: string[];
  timezone: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  screenColorDepth: number | null;
  devicePixelRatio: number | null;
  hardwareConcurrency: number | null;
  deviceMemoryGb: number | null;
  touchSupport: boolean | null;
  cookieEnabled: boolean | null;
  vendor: string | null;
  appVersion: string | null;
  frontendBuild: string | null;
  geolocationSource: 'BrowserCoordinates' | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  geolocationCapturedAtUtc: string | null;
}

export interface SessionHeartbeatRequest {
  sessionPublicId: string | null;
  deviceContext: DeviceContext;
  clientUtc: string;
  visibilityState: string;
  route: string;
  activityState: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  navItems: NavItem[];
}

export interface LoginResponse {
  user: User | null;
  navItems: NavItem[] | null;
  otpRequired: boolean;
  pendingToken?: string | null;
  otpSetupRequired?: boolean;
  userId?: string | null;
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
