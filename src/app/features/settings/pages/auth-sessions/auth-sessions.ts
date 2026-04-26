import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SearchBarComponent } from '../../../../shared/design-system/components/search-bar/search-bar.component';
import { DataTableComponent, ColumnDef, PageEvent, PaginatorConfig } from '../../../../shared/design-system/components/table';
import { AuthService } from '../../../../core/http/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthSessionsService } from '../../../../core/http/services/auth-sessions.service';
import { CatalogService } from '../../../../core/http/services/catalog.service';
import { ConfirmDialogService } from '../../../../shared/design-system/services/confirm-dialog.service';
import { AuthSessionDetail, AuthSessionListItem, AuthSessionLocation } from '../../models/auth-session.model';
import { SessionLocationCardsComponent } from '../../../../shared/ui/session-location-cards/session-location-cards';
import { SessionLocationMapComponent } from '../../../../shared/ui/session-location-map';

interface SessionRow {
  sessionPublicId: string;
  userDisplayName: string;
  statusLabel: string;
  loginFlowLabel: string;
  startedAtLabel: string;
  heartbeatAtLabel: string;
  deviceLabel: string;
}

interface SessionStatusOption {
  value: string;
  label: string;
  translate: boolean;
}

@Component({
  selector: 'app-auth-sessions-page',
  standalone: true,
  imports: [TranslatePipe, SearchBarComponent, DataTableComponent, SessionLocationMapComponent, SessionLocationCardsComponent],
  templateUrl: './auth-sessions.html',
  host: { class: 'flex flex-1 min-h-0 flex-col overflow-hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthSessionsPage {
  protected readonly auth = inject(AuthService);
  private readonly sessionsService = inject(AuthSessionsService);
  private readonly catalogs = inject(CatalogService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly authSessionStatusCatalogTable = 'auth_session_status_catalog';

  protected readonly sessions = signal<AuthSessionListItem[]>([]);
  protected readonly selectedSession = signal<AuthSessionDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly detailLoading = signal(false);
  protected readonly revoking = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal('');
  protected readonly onlyOpen = signal(false);
  protected readonly statusOptions = signal<SessionStatusOption[]>([
    { value: '', label: 'AUTH_SESSIONS.FILTERS.ALL_STATUSES', translate: true },
  ]);
  protected readonly paginator = signal<PaginatorConfig>({ page: 1, pageSize: 5, total: 0, pageSizeOptions: [5,10,20] });

  protected readonly columns: ColumnDef<SessionRow>[] = [
    { key: 'userDisplayName', header: 'AUTH_SESSIONS.COLUMNS.USER' },
    { key: 'statusLabel', header: 'AUTH_SESSIONS.COLUMNS.STATUS', width: '130px' },
    { key: 'loginFlowLabel', header: 'AUTH_SESSIONS.COLUMNS.FLOW', width: '160px' },
    { key: 'startedAtLabel', header: 'AUTH_SESSIONS.COLUMNS.STARTED', width: '160px' },
    { key: 'heartbeatAtLabel', header: 'AUTH_SESSIONS.COLUMNS.HEARTBEAT', width: '160px' },
    { key: 'deviceLabel', header: 'AUTH_SESSIONS.COLUMNS.DEVICE' },
  ];

  protected readonly rows = computed<SessionRow[]>(() => this.sessions().map(session => ({
    sessionPublicId: session.sessionPublicId,
    userDisplayName: session.userDisplayName,
    statusLabel: this.translateStatus(session.status),
    loginFlowLabel: this.translateFlow(session.loginFlow),
    startedAtLabel: this.formatDate(session.startedAtUtc),
    heartbeatAtLabel: this.formatDate(session.lastHeartbeatAtUtc),
    deviceLabel: session.deviceLabel ?? 'AUTH_SESSIONS.NOT_AVAILABLE',
  })));

  protected readonly selectedSummary = computed(() => {
    const session = this.selectedSession();
    if (!session) {
      return [] as Array<{ label: string; value: string }>;
    }

    return [
      { label: 'AUTH_SESSIONS.DETAIL.STATUS', value: this.translateStatus(session.status) },
      { label: 'AUTH_SESSIONS.DETAIL.FLOW', value: this.translateFlow(session.loginFlow) },
      { label: 'AUTH_SESSIONS.DETAIL.STARTED', value: this.formatDate(session.startedAtUtc) },
      { label: 'AUTH_SESSIONS.DETAIL.AUTHENTICATED', value: this.formatDate(session.authenticatedAtUtc) },
      { label: 'AUTH_SESSIONS.DETAIL.LAST_HEARTBEAT', value: this.formatDate(session.lastHeartbeatAtUtc) },
      { label: 'AUTH_SESSIONS.DETAIL.LAST_REQUEST', value: this.formatDate(session.lastAuthenticatedRequestAtUtc) },
      { label: 'AUTH_SESSIONS.DETAIL.EXPIRES', value: this.formatDate(session.expiresAtUtc) },
      { label: 'AUTH_SESSIONS.DETAIL.DURATION', value: this.formatDuration(session.durationSeconds) },
      { label: 'AUTH_SESSIONS.DETAIL.IP_FIRST', value: session.ipFirst ?? 'AUTH_SESSIONS.NOT_AVAILABLE' },
      { label: 'AUTH_SESSIONS.DETAIL.IP_LAST', value: session.ipLast ?? 'AUTH_SESSIONS.NOT_AVAILABLE' },
      { label: 'AUTH_SESSIONS.DETAIL.BROWSER', value: [session.browserName, session.browserVersion].filter(Boolean).join(' ') || 'AUTH_SESSIONS.NOT_AVAILABLE' },
      { label: 'AUTH_SESSIONS.DETAIL.OS', value: [session.osName, session.osVersion].filter(Boolean).join(' ') || 'AUTH_SESSIONS.NOT_AVAILABLE' },
      { label: 'AUTH_SESSIONS.DETAIL.DEVICE', value: session.deviceLabel ?? 'AUTH_SESSIONS.NOT_AVAILABLE' },
      { label: 'AUTH_SESSIONS.DETAIL.TIMEZONE', value: session.timezone ?? 'AUTH_SESSIONS.NOT_AVAILABLE' },
      { label: 'AUTH_SESSIONS.DETAIL.SCREEN', value: session.screenResolution ?? 'AUTH_SESSIONS.NOT_AVAILABLE' },
      { label: 'AUTH_SESSIONS.DETAIL.INITIAL_LOCATION', value: this.formatLocation(session.initialLocation) },
      { label: 'AUTH_SESSIONS.DETAIL.LAST_LOCATION', value: this.formatLocation(session.lastLocation) },
    ];
  });

  protected readonly canRevokeSelectedSession = computed(() => {
    const session = this.selectedSession();
    if (!session || this.revoking() || !this.auth.hasPermission('settings.sessions.revoke')) {
      return false;
    }

    return session.status === 'Active' || session.status === 'PendingOtp';
  });

  constructor() {
    this.loadStatusOptions();
    this.loadSessions();
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
    this.paginator.update(current => ({ ...current, page: 1 }));
    this.loadSessions();
  }

  protected onStatusChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.paginator.update(current => ({ ...current, page: 1 }));
    this.loadSessions();
  }

  protected onOnlyOpenChange(event: Event): void {
    this.onlyOpen.set((event.target as HTMLInputElement).checked);
    this.paginator.update(current => ({ ...current, page: 1 }));
    this.loadSessions();
  }

  protected onPageChange(event: PageEvent): void {
    this.paginator.update(current => ({ ...current, page: event.page, pageSize: event.pageSize }));
    this.loadSessions();
  }

  protected onRowClick(row: SessionRow): void {
    this.loadSessionDetail(row.sessionPublicId);
  }

  protected refresh(): void {
    this.loadSessions();
  }

  protected async revokeSelectedSession(): Promise<void> {
    const session = this.selectedSession();
    if (!session || !this.canRevokeSelectedSession()) {
      return;
    }

    const confirmed = await this.confirmDialog.open({
      title: this.translate.instant('AUTH_SESSIONS.ACTIONS.REVOKE_CONFIRM_TITLE'),
      message: this.translate.instant('AUTH_SESSIONS.ACTIONS.REVOKE_CONFIRM_MESSAGE', {
        user: session.userDisplayName,
        device: session.deviceLabel ?? this.translate.instant('AUTH_SESSIONS.NOT_AVAILABLE'),
      }),
      confirmLabel: this.translate.instant('AUTH_SESSIONS.ACTIONS.REVOKE'),
      cancelLabel: this.translate.instant('CATALOGS.CANCEL'),
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.revoking.set(true);
    this.sessionsService.revokeSession(session.sessionPublicId).subscribe({
      next: () => {
        const revokedCurrentSession = session.isCurrentSession;
        this.revoking.set(false);

        if (revokedCurrentSession) {
          this.toast.success('AUTH_SESSIONS.ACTIONS.REVOKE_SELF_SUCCESS');
          this.auth.logout();
          return;
        }

        this.toast.success('AUTH_SESSIONS.ACTIONS.REVOKE_SUCCESS');
        this.loadSessions();
      },
      error: () => {
        this.revoking.set(false);
        this.toast.error('AUTH_SESSIONS.ACTIONS.REVOKE_ERROR');
      },
    });
  }

  protected eventTone(severity: string): string {
    return {
      info: 'bg-slate-100 text-slate-700',
      warning: 'bg-amber-100 text-amber-700',
      error: 'bg-red-100 text-red-700',
    }[severity.toLowerCase()] ?? 'bg-slate-100 text-slate-700';
  }

  protected formatDate(value: string | null): string {
    if (!value) {
      return 'AUTH_SESSIONS.NOT_AVAILABLE';
    }

    return new Date(value).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected formatDuration(value: number | null): string {
    if (value == null) {
      return 'AUTH_SESSIONS.NOT_AVAILABLE';
    }

    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = value % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  protected hasMap(session: AuthSessionDetail | null): boolean {
    if (!session) {
      return false;
    }

    return this.hasCoordinates(session.initialLocation) || this.hasCoordinates(session.lastLocation);
  }

  protected formatLocation(location: AuthSessionLocation | null): string {
    if (!location) {
      return 'AUTH_SESSIONS.NOT_AVAILABLE';
    }

    const label = location.label?.trim();
    const coordinates = this.formatCoordinates(location);
    const source = this.translateLocationSource(location.source);

    if (label && coordinates) {
      return `${label} · ${source} · ${coordinates}`;
    }

    if (label) {
      return `${label} · ${source}`;
    }

    if (coordinates) {
      return `${source} · ${coordinates}`;
    }

    return source;
  }

  protected formatCoordinates(location: AuthSessionLocation | null): string {
    if (!this.hasCoordinates(location)) {
      return '';
    }

    return `${location.latitude!.toFixed(5)}, ${location.longitude!.toFixed(5)}`;
  }

  protected formatAccuracy(location: AuthSessionLocation | null): string {
    if (!location?.accuracyMeters) {
      return this.translate.instant('AUTH_SESSIONS.NOT_AVAILABLE');
    }

    return `${location.accuracyMeters.toFixed(0)} m`;
  }

  private loadSessions(): void {
    this.loading.set(true);
    const { page, pageSize } = this.paginator();

    this.sessionsService.getSessions(page, pageSize, this.searchQuery() || undefined, this.statusFilter() || undefined, this.onlyOpen()).subscribe({
      next: response => {
        this.sessions.set(response.items);
        this.paginator.update(current => ({ ...current, page: response.page, pageSize: response.pageSize, total: response.totalCount }));
        this.loading.set(false);

        const selectedId = this.selectedSession()?.sessionPublicId;
        const nextSelected = response.items.find(item => item.sessionPublicId === selectedId) ?? response.items[0] ?? null;
        if (!nextSelected) {
          this.selectedSession.set(null);
          return;
        }

        this.loadSessionDetail(nextSelected.sessionPublicId);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('AUTH_SESSIONS.LOAD_ERROR');
      },
    });
  }

  private loadStatusOptions(): void {
    this.catalogs.queryByTable(this.authSessionStatusCatalogTable, '', 20).subscribe({
      next: items => {
        this.statusOptions.set([
          { value: '', label: 'AUTH_SESSIONS.FILTERS.ALL_STATUSES', translate: true },
          ...items.map(item => ({ value: item.key, label: item.value, translate: false })),
        ]);
      },
      error: () => {
        this.statusOptions.set([
          { value: '', label: 'AUTH_SESSIONS.FILTERS.ALL_STATUSES', translate: true },
        ]);
      },
    });
  }

  private loadSessionDetail(sessionPublicId: string): void {
    this.detailLoading.set(true);
    this.sessionsService.getSession(sessionPublicId).subscribe({
      next: session => {
        this.selectedSession.set(session);
        this.detailLoading.set(false);
      },
      error: () => {
        this.detailLoading.set(false);
        this.toast.error('AUTH_SESSIONS.DETAIL_ERROR');
      },
    });
  }

  private translateStatus(value: string): string {
    return `AUTH_SESSIONS.STATUS.${value.toUpperCase()}`;
  }

  private translateFlow(value: string): string {
    return `AUTH_SESSIONS.FLOW.${value.toUpperCase()}`;
  }

  private translateLocationSource(value: string): string {
    return this.translate.instant(`AUTH_SESSIONS.LOCATION_SOURCE.${value.toUpperCase()}`);
  }

  private hasCoordinates(location: AuthSessionLocation | null): location is AuthSessionLocation {
    return !!location && typeof location.latitude === 'number' && typeof location.longitude === 'number';
  }
}
