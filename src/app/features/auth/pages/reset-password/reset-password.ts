import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/http/services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './reset-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex w-full min-h-screen' },
})
export class ResetPasswordPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  protected isLoading = signal(false);
  protected success = signal(false);
  protected error = signal('');
  protected otpRequired = signal(false);
  protected otpConfigured = signal(false);
  protected manualEntryKey = signal('');
  protected qrCodeDataUrl = signal('');

  private userId = '';
  private secret = '';

  protected form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    otpCode: ['', [Validators.pattern(/^\d{6}$/)]],
  }, { validators: this.passwordsMatch });

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('userId') ?? '';
    this.secret = this.route.snapshot.queryParamMap.get('secret') ?? '';

    if (!this.userId || !this.secret) {
      this.error.set('RESET_PASSWORD.INVALID_LINK');
      return;
    }

    this.auth.getOtpSetup(this.userId).subscribe({
      next: setup => {
        this.otpRequired.set(setup.otpRequired);
        this.otpConfigured.set(setup.otpConfigured);
        this.manualEntryKey.set(setup.manualEntryKey ?? '');
        this.qrCodeDataUrl.set(setup.qrCodeDataUrl ?? '');
      },
      error: (error: unknown) => {
        this.error.set(this.resolveApiErrorLabel(error, 'RESET_PASSWORD.ERROR'));
      },
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, otpCode } = this.form.getRawValue();
    if (this.otpRequired() && !/^\d{8}$/.test(otpCode ?? '')) {
      this.form.get('otpCode')?.markAsTouched();
      this.form.get('otpCode')?.setErrors({ pattern: true });
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    const otpFlow = !this.otpRequired()
      ? of(void 0)
      : this.otpConfigured()
        ? this.auth.verifyOtpCode(otpCode!, this.userId)
        : this.auth.completeOtpSetup(otpCode!, this.userId);

    otpFlow.pipe(
      switchMap(() => this.auth.completePasswordRecovery(this.userId, this.secret, password!))
    ).subscribe({
      next: () => {
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (error: unknown) => {
        this.error.set(this.resolveApiErrorLabel(error, this.otpRequired() ? 'RESET_PASSWORD.OTP_ERROR' : 'RESET_PASSWORD.ERROR'));
        this.isLoading.set(false);
      },
    });
  }

  protected hasError(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!(c?.hasError(error) && c?.touched);
  }

  protected get passwordsMismatch(): boolean {
    return !!(this.form.hasError('mismatch') && this.form.get('confirmPassword')?.touched);
  }

  private passwordsMatch(group: import('@angular/forms').AbstractControl) {
    const pw = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { mismatch: true } : null;
  }

  private resolveApiErrorLabel(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackKey;
    }

    const apiLabel = error.error?.error?.label;
    if (typeof apiLabel === 'string' && apiLabel.trim()) {
      return apiLabel;
    }

    const apiMessage = error.error?.error?.message;
    return typeof apiMessage === 'string' && apiMessage.trim() ? apiMessage : fallbackKey;
  }
}
