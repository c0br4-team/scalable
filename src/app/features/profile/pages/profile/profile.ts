import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../core/http/services/auth.service';
import { AuthSessionsService } from '../../../../core/http/services/auth-sessions.service';
import { AuthSessionDetail, AuthSessionLocation } from '../../../settings/models/auth-session.model';
import { SessionLocationCardsComponent } from '../../../../shared/ui/session-location-cards/session-location-cards';
import { SessionLocationMapComponent } from '../../../../shared/ui/session-location-map';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPwd = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return newPwd && confirm && newPwd !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, NgIcon, TranslatePipe, SessionLocationMapComponent, SessionLocationCardsComponent],
  templateUrl: './profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col flex-1 overflow-y-auto' },
})
export class ProfilePage {
  protected auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly authSessionsService = inject(AuthSessionsService);
  private readonly translate = inject(TranslateService);

  protected infoSaved = signal(false);
  protected pwdSaved = signal(false);
  protected pwdError = signal('');
  protected showCurrent = signal(false);
  protected showNew = signal(false);
  protected showConfirm = signal(false);

  protected avatarUploading = signal(false);
  protected avatarError = signal<string | null>(null);
  protected avatarLoadFailed = signal(false);
  protected currentSession = signal<AuthSessionDetail | null>(null);
  protected currentSessionLoading = signal(true);

  protected infoForm = this.fb.group({
    name: [this.auth.user()?.name ?? '', [Validators.required, Validators.minLength(2)]],
    email: [{ value: this.auth.user()?.email ?? '', disabled: true }],
    role: [{ value: this.auth.user()?.role ?? '', disabled: true }],
  });

  protected pwdForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      otpCode: ['', this.auth.user()?.otpEnabled ? [Validators.required, Validators.pattern(/^\d{6}$/)] : []],
    },
    { validators: passwordsMatchValidator },
  );

  protected saveInfo(): void {
    if (this.infoForm.invalid) return;
    // TODO: conectar con HTTP real — por ahora actualiza el estado local
    this.infoSaved.set(true);
    setTimeout(() => this.infoSaved.set(false), 3000);
  }

  protected savePwd(): void {
    if (this.pwdForm.invalid) {
      this.pwdForm.markAllAsTouched();
      return;
    }

    this.pwdError.set('');
    this.pwdSaved.set(false);

    const { currentPassword, newPassword, otpCode } = this.pwdForm.getRawValue();
    this.auth.changePassword(currentPassword!, newPassword!, otpCode ?? '').subscribe({
      next: () => {
        this.pwdForm.reset();
        this.pwdSaved.set(true);
        setTimeout(() => this.pwdSaved.set(false), 3000);
      },
      error: (err: { error?: { error?: { message?: string } } }) => {
        this.pwdError.set(err?.error?.error?.message ?? 'No fue posible actualizar la contraseña.');
      },
    });
  }

  protected readonly avatarLetter = computed(() =>
    this.auth.user()?.name?.charAt(0)?.toUpperCase() ?? 'U'
  );

  private readonly avatarWatcher = effect(() => {
    this.auth.currentAvatarUrl();
    this.avatarLoadFailed.set(false);
  });

  constructor() {
    this.loadCurrentSession();
  }

  protected onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarError.set(null);

    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      this.avatarError.set('Solo se aceptan imágenes JPEG, PNG o WebP.');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.avatarError.set('El archivo supera el límite de 5 MB.');
      input.value = '';
      return;
    }

    // Preview local inmediato — se guarda en AuthService para que el header también lo refleje
    const reader = new FileReader();
    reader.onload = e => this.auth.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);

    this.avatarUploading.set(true);
    this.auth.uploadAvatar(file).subscribe({
      next: () => {
        this.avatarUploading.set(false);
      },
      error: (err: unknown) => {
        this.avatarUploading.set(false);
        this.auth.avatarPreview.set(null);
        this.avatarError.set(err instanceof Error ? err.message : 'Error al subir la imagen.');
        input.value = '';
      },
    });
  }

  protected onAvatarLoadError(): void {
    this.avatarLoadFailed.set(true);
  }

  protected hasCurrentSessionMap(): boolean {
    const session = this.currentSession();
    if (!session) {
      return false;
    }

    return this.hasCoordinates(session.initialLocation) || this.hasCoordinates(session.lastLocation);
  }

  protected formatSessionDate(value: string | null): string {
    if (!value) {
      return this.translate.instant('PROFILE.SESSION.NOT_AVAILABLE');
    }

    return new Date(value).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected formatSessionLocation(location: AuthSessionLocation | null): string {
    if (!location) {
      return this.translate.instant('PROFILE.SESSION.NOT_AVAILABLE');
    }

    const label = location.label?.trim();
    const coordinates = this.formatCoordinates(location);
    const source = this.translate.instant(`AUTH_SESSIONS.LOCATION_SOURCE.${location.source.toUpperCase()}`);

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
      return this.translate.instant('PROFILE.SESSION.NOT_AVAILABLE');
    }

    return `${location.accuracyMeters.toFixed(0)} m`;
  }

  protected formatBrowserLabel(session: AuthSessionDetail): string {
    return [session.browserName, session.browserVersion].filter(part => !!part).join(' ')
      || this.translate.instant('PROFILE.SESSION.NOT_AVAILABLE');
  }

  private loadCurrentSession(): void {
    this.currentSessionLoading.set(true);
    this.authSessionsService.getCurrentSession().subscribe({
      next: session => {
        this.currentSession.set(session);
        this.currentSessionLoading.set(false);
      },
      error: () => {
        this.currentSession.set(null);
        this.currentSessionLoading.set(false);
      },
    });
  }

  private hasCoordinates(location: AuthSessionLocation | null): location is AuthSessionLocation {
    return !!location && typeof location.latitude === 'number' && typeof location.longitude === 'number';
  }
}
