import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppwriteService } from '../../../../core/auth/services/appwrite.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './reset-password.html',
  host: { class: 'flex w-full min-h-screen' },
})
export class ResetPasswordPage implements OnInit {
  private fb      = inject(FormBuilder);
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private appwrite = inject(AppwriteService);

  protected isLoading = signal(false);
  protected success   = signal(false);
  protected error     = signal('');

  private userId = '';
  private secret = '';

  protected form = this.fb.group({
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordsMatch });

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('userId') ?? '';
    this.secret = this.route.snapshot.queryParamMap.get('secret') ?? '';

    if (!this.userId || !this.secret) {
      this.error.set('RESET_PASSWORD.INVALID_LINK');
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isLoading.set(true);
    this.error.set('');

    const { password } = this.form.getRawValue();

    this.appwrite.updateRecovery(this.userId, this.secret, password!).then(() => {
      this.success.set(true);
      setTimeout(() => this.router.navigate(['/login']), 3000);
    }).catch(() => {
      this.error.set('RESET_PASSWORD.ERROR');
      this.isLoading.set(false);
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
    const pw  = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { mismatch: true } : null;
  }
}
