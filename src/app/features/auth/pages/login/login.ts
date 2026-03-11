import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NgIcon],
  templateUrl: './login.html',
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  protected isLoading = signal(false);
  protected showPassword = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
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

    try {
      const { email, password } = this.form.getRawValue();
      this.auth.login({ email: email!, password: password! });
    } catch {
      this.errorMessage.set('Credenciales inválidas. Intenta de nuevo.');
      this.isLoading.set(false);
    }
  }

  protected hasError(field: string, error: string): boolean {
    const control = this.form.get(field);
    return !!(control?.hasError(error) && control?.touched);
  }
}
