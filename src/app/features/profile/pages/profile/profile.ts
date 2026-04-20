import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../../core/auth/services/auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPwd = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return newPwd && confirm && newPwd !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, NgIcon, TranslatePipe],
  templateUrl: './profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col flex-1 overflow-y-auto' },
})
export class ProfilePage {
  protected auth = inject(AuthService);
  private fb = inject(FormBuilder);

  protected infoSaved = signal(false);
  protected pwdSaved = signal(false);
  protected pwdError = signal('');
  protected showCurrent = signal(false);
  protected showNew = signal(false);
  protected showConfirm = signal(false);

  protected avatarUploading = signal(false);
  protected avatarError = signal<string | null>(null);

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
}
