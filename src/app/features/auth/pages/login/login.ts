import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppwriteException } from 'appwrite';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NgIcon, TranslatePipe],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex w-full min-h-screen' },
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private lang = inject(LanguageService);

  protected isLoading = signal(false);
  protected showPassword = signal(false);
  protected otpRequired = signal(false);
  protected otpSetupRequired = signal(false);
  protected otpManualEntryKey = signal('');
  protected otpQrCodeDataUrl = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);
  protected recoveryMessage = signal<string | null>(null);
  protected pendingToken = signal<string | null>(null);

  protected form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected otpForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  protected togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.recoveryMessage.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: response => {
        if (response.otpRequired) {
          this.pendingToken.set(response.pendingToken ?? null);
          this.otpRequired.set(true);
          this.otpSetupRequired.set(!!response.otpSetupRequired);
          this.errorMessage.set(null);

          if (response.otpSetupRequired) {
            this.auth.getOtpSetup().subscribe({
              next: setup => {
                this.otpManualEntryKey.set(setup.manualEntryKey ?? '');
                this.otpQrCodeDataUrl.set(setup.qrCodeDataUrl ?? null);
                this.isLoading.set(false);
              },
              error: () => {
                this.errorMessage.set('LOGIN.ERROR_NETWORK');
                this.isLoading.set(false);
              },
            });
            return;
          }

          this.isLoading.set(false);
          return;
        }

        const prefs = this.auth.preferences();
        if (prefs) this.lang.set(prefs.language);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        const isInvalidCredentials = err instanceof AppwriteException && err.code === 401;
        this.errorMessage.set(isInvalidCredentials ? 'LOGIN.ERROR_INVALID' : 'LOGIN.ERROR_NETWORK');
        this.isLoading.set(false);
      },
    });
  }

  protected onValidateOtp(): void {
    if (this.otpSetupRequired()) {
      this.onCompleteOtpSetup();
      return;
    }

    if (this.otpForm.invalid || !this.pendingToken()) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.validateLoginOtp(this.pendingToken()!, this.otpForm.getRawValue().code!).subscribe({
      next: () => {
        const prefs = this.auth.preferences();
        if (prefs) this.lang.set(prefs.language);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('LOGIN.ERROR_INVALID_OTP');
        this.isLoading.set(false);
      },
    });
  }

  protected onCompleteOtpSetup(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.completeLoginOtpSetup(this.otpForm.getRawValue().code!).subscribe({
      next: () => {
        const prefs = this.auth.preferences();
        if (prefs) this.lang.set(prefs.language);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('LOGIN.ERROR_INVALID_OTP');
        this.isLoading.set(false);
      },
    });
  }

  protected requestRecovery(): void {
    const emailControl = this.form.get('email');
    if (!emailControl?.value || emailControl.invalid) {
      emailControl?.markAsTouched();
      this.errorMessage.set('LOGIN.RECOVERY_EMAIL_REQUIRED');
      this.recoveryMessage.set(null);
      return;
    }

    this.errorMessage.set(null);
    this.recoveryMessage.set(null);
    this.auth.requestPasswordRecovery(emailControl.value).then(() => {
      this.recoveryMessage.set('LOGIN.RECOVERY_SENT');
    }).catch(() => {
      this.errorMessage.set('LOGIN.ERROR_NETWORK');
    });
  }

  protected hasError(field: string, error: string): boolean {
    const control = this.form.get(field);
    return !!(control?.hasError(error) && control?.touched);
  }

  protected hasOtpError(error: string): boolean {
    const control = this.otpForm.get('code');
    return !!(control?.hasError(error) && control?.touched);
  }

  protected features = [
    { icon: 'heroDocumentText', text: 'LOGIN.FEATURE_1' },
    { icon: 'heroUsers', text: 'LOGIN.FEATURE_2' },
    { icon: 'heroChartBar', text: 'LOGIN.FEATURE_3' },
  ];
}
