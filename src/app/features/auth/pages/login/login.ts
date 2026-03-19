import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { LanguageService } from '../../../../core/services/language.service';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppwriteException } from 'appwrite';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NgIcon, TranslatePipe],
  templateUrl: './login.html',
   host: { class: 'flex w-full min-h-screen' },
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private lang = inject(LanguageService);

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

    const { email, password } = this.form.getRawValue();
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => {
        const prefs = this.auth.preferences();
        if (prefs) this.lang.set(prefs.language);
      },
      error: (err: unknown) => {
        const isInvalidCredentials = err instanceof AppwriteException && err.code === 401;
        this.errorMessage.set(isInvalidCredentials ? 'LOGIN.ERROR_INVALID' : 'LOGIN.ERROR_NETWORK');
        this.isLoading.set(false);
      },
    });
  }

  protected hasError(field: string, error: string): boolean {
    const control = this.form.get(field);
    return !!(control?.hasError(error) && control?.touched);
  }

  protected features = [
    { icon: 'heroDocumentText', text: 'LOGIN.FEATURE_1' },
    { icon: 'heroUsers', text: 'LOGIN.FEATURE_2' },
    { icon: 'heroChartBar', text: 'LOGIN.FEATURE_3' },
  ];
}
