import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { EMPTY, Observable, catchError, finalize, from, map, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SKIP_GLOBAL_LOADING } from '../../interceptors/loading.interceptor';
import { DeviceContext, SessionHeartbeatRequest } from '../../auth/models/user.model';

type TimerHandle = ReturnType<typeof setTimeout>;

@Injectable({ providedIn: 'root' })
export class SessionTrackingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly installationIdKey = 'mercadolaw.installation_id';
  private readonly visibleHeartbeatMs = 90_000;
  private readonly hiddenHeartbeatMs = 300_000;

  private heartbeatTimer: TimerHandle | null = null;
  private trackingActive = false;
  private heartbeatInFlight = false;
  private cachedLocation: BrowserLocationSnapshot | null = null;
  private inflightLocationRequest: Promise<BrowserLocationSnapshot | null> | null = null;

  private readonly onVisibilityChange = () => {
    if (!this.trackingActive) {
      return;
    }

    if (document.visibilityState === 'visible') {
      this.sendHeartbeat().subscribe();
    }

    this.scheduleNextHeartbeat();
  };

  private readonly onWindowFocus = () => {
    if (!this.trackingActive) {
      return;
    }

    this.sendHeartbeat().subscribe();
  };

  private readonly onConnectivityChange = () => {
    if (!this.trackingActive) {
      return;
    }

    if (navigator.onLine) {
      this.sendHeartbeat().subscribe();
    }

    this.scheduleNextHeartbeat();
  };

  private readonly onPageHide = () => {
    if (!this.trackingActive) {
      return;
    }

    this.sendHeartbeatBeacon('pagehide');
  };

  start(): void {
    if (this.trackingActive) {
      this.scheduleNextHeartbeat();
      return;
    }

    this.trackingActive = true;
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('focus', this.onWindowFocus);
    window.addEventListener('online', this.onConnectivityChange);
    window.addEventListener('offline', this.onConnectivityChange);
    window.addEventListener('pagehide', this.onPageHide);
    window.addEventListener('beforeunload', this.onPageHide);

    this.sendHeartbeat().subscribe();
    this.scheduleNextHeartbeat();
  }

  stop(sendFinalBeacon = false): void {
    if (sendFinalBeacon && this.trackingActive) {
      this.sendHeartbeatBeacon('stop');
    }

    this.trackingActive = false;
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('focus', this.onWindowFocus);
    window.removeEventListener('online', this.onConnectivityChange);
    window.removeEventListener('offline', this.onConnectivityChange);
    window.removeEventListener('pagehide', this.onPageHide);
    window.removeEventListener('beforeunload', this.onPageHide);
  }

  buildDeviceContext(): DeviceContext {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const screenInfo = window.screen;
    const location = this.cachedLocation;

    return {
      installationId: this.getInstallationId(),
      userAgent: nav.userAgent ?? null,
      platform: nav.platform ?? null,
      language: nav.language ?? null,
      languages: [...(nav.languages ?? [])],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
      screenWidth: screenInfo?.width ?? null,
      screenHeight: screenInfo?.height ?? null,
      screenColorDepth: screenInfo?.colorDepth ?? null,
      devicePixelRatio: Number.isFinite(window.devicePixelRatio) ? window.devicePixelRatio : null,
      hardwareConcurrency: nav.hardwareConcurrency ?? null,
      deviceMemoryGb: nav.deviceMemory ?? null,
      touchSupport: typeof nav.maxTouchPoints === 'number' ? nav.maxTouchPoints > 0 : null,
      cookieEnabled: nav.cookieEnabled ?? null,
      vendor: nav.vendor ?? null,
      appVersion: '1.0.0',
      frontendBuild: environment.production ? 'production' : 'development',
      geolocationSource: location?.source ?? null,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      accuracyMeters: location?.accuracyMeters ?? null,
      geolocationCapturedAtUtc: location?.capturedAtUtc ?? null,
    };
  }

  async buildDeviceContextAsync(promptForGeolocation = false): Promise<DeviceContext> {
    const location = await this.resolveBrowserLocation(promptForGeolocation);
    if (location) {
      this.cachedLocation = location;
    }

    return this.buildDeviceContext();
  }

  sendHeartbeat(): Observable<void> {
    if (!this.trackingActive || !navigator.onLine || this.heartbeatInFlight) {
      return EMPTY;
    }

    this.heartbeatInFlight = true;
    return from(this.buildDeviceContextAsync(false)).pipe(
      switchMap(deviceContext => this.http.post(`${this.apiUrl}/auth/session/heartbeat`, this.buildHeartbeatPayload('active', deviceContext), {
        withCredentials: true,
        context: new HttpContext().set(SKIP_GLOBAL_LOADING, true),
      })),
      map(() => void 0),
      catchError(() => EMPTY),
      finalize(() => {
        this.heartbeatInFlight = false;
      }),
    );
  }

  private scheduleNextHeartbeat(): void {
    if (!this.trackingActive) {
      return;
    }

    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
    }

    const interval = document.visibilityState === 'visible'
      ? this.visibleHeartbeatMs
      : this.hiddenHeartbeatMs;

    this.heartbeatTimer = setTimeout(() => {
      this.sendHeartbeat().subscribe({
        complete: () => this.scheduleNextHeartbeat(),
      });
    }, interval);
  }

  private sendHeartbeatBeacon(activityState: string): void {
    if (typeof navigator.sendBeacon !== 'function') {
      return;
    }

    const payload: SessionHeartbeatRequest = this.buildHeartbeatPayload(activityState, this.buildDeviceContext());
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(`${this.apiUrl}/auth/session/heartbeat`, blob);
  }

  private buildHeartbeatPayload(activityState: string, deviceContext: DeviceContext): SessionHeartbeatRequest {
    return {
      sessionPublicId: null,
      deviceContext,
      clientUtc: new Date().toISOString(),
      visibilityState: document.visibilityState,
      route: `${location.pathname}${location.search}${location.hash}`,
      activityState,
    };
  }

  private async resolveBrowserLocation(promptForGeolocation: boolean): Promise<BrowserLocationSnapshot | null> {
    if (!('geolocation' in navigator)) {
      return this.cachedLocation;
    }

    const permissions = navigator.permissions;
    if (!promptForGeolocation && permissions?.query) {
      try {
        const status = await permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state !== 'granted') {
          return this.cachedLocation;
        }
      } catch {
        return this.cachedLocation;
      }
    }

    if (this.inflightLocationRequest) {
      return this.inflightLocationRequest;
    }

    this.inflightLocationRequest = new Promise<BrowserLocationSnapshot | null>(resolve => {
      navigator.geolocation.getCurrentPosition(
        position => resolve({
          source: 'BrowserCoordinates',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          capturedAtUtc: new Date().toISOString(),
        }),
        () => resolve(this.cachedLocation),
        {
          enableHighAccuracy: false,
          timeout: 2500,
          maximumAge: 120000,
        },
      );
    });

    try {
      return await this.inflightLocationRequest;
    } finally {
      this.inflightLocationRequest = null;
    }
  }

  private getInstallationId(): string {
    const existing = localStorage.getItem(this.installationIdKey);
    if (existing) {
      return existing;
    }

    const next = crypto.randomUUID();
    localStorage.setItem(this.installationIdKey, next);
    return next;
  }
}

interface BrowserLocationSnapshot {
  source: 'BrowserCoordinates';
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAtUtc: string;
}
