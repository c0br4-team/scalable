import { Component, inject, signal } from '@angular/core';
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

  protected infoForm = this.fb.group({
    name: [this.auth.user()?.name ?? '', [Validators.required, Validators.minLength(2)]],
    email: [{ value: this.auth.user()?.email ?? '', disabled: true }],
    role: [{ value: this.auth.user()?.role ?? '', disabled: true }],
  });

  protected pwdForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
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
    if (this.pwdForm.invalid) return;
    this.pwdError.set('');
    // TODO: conectar con HTTP real — validar contraseña actual en el servidor
    this.pwdForm.reset();
    this.pwdSaved.set(true);
    setTimeout(() => this.pwdSaved.set(false), 3000);
  }

  protected get avatarLetter(): string {
    return this.auth.user()?.name?.charAt(0)?.toUpperCase() ?? 'U';
  }
}
