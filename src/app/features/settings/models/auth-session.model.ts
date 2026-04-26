export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AuthSessionListItem {
  sessionPublicId: string;
  cookieSessionId: string | null;
  appUserId: string;
  userDisplayName: string;
  userEmail: string;
  userRoleCode: string;
  loginFlow: string;
  status: string;
  isCurrentSession: boolean;
  startedAtUtc: string;
  authenticatedAtUtc: string | null;
  lastHeartbeatAtUtc: string | null;
  lastAuthenticatedRequestAtUtc: string | null;
  endedAtUtc: string | null;
  expiresAtUtc: string | null;
  durationSeconds: number | null;
  terminationReason: string | null;
  ipLast: string | null;
  deviceLabel: string | null;
  browserName: string | null;
  osName: string | null;
  deviceType: string;
  platform: string | null;
  language: string | null;
  timezone: string | null;
}

export interface AuthSessionEvent {
  id: string;
  occurredAtUtc: string;
  eventType: string;
  severity: string;
  message: string;
  ipAddress: string | null;
  userAgent: string | null;
  requestPath: string | null;
  httpMethod: string | null;
  traceId: string | null;
}

export interface AuthSessionLocation {
  source: string;
  label: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  capturedAtUtc: string | null;
}

export interface AuthSessionDetail extends AuthSessionListItem {
  ipFirst: string | null;
  userAgentFirst: string | null;
  userAgentLast: string | null;
  browserVersion: string | null;
  osVersion: string | null;
  screenResolution: string | null;
  hardwareConcurrency: number | null;
  deviceMemoryGb: number | null;
  appVersion: string | null;
  frontendBuild: string | null;
  initialLocation: AuthSessionLocation | null;
  lastLocation: AuthSessionLocation | null;
  events: AuthSessionEvent[];
}
