import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppUser } from '../../models/user.model';

@Component({
  selector: 'app-user-drawer',
  imports: [ReactiveFormsModule, NgIcon, TranslatePipe],
  templateUrl: './user-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDrawerComponent implements OnChanges {
  open    = input<boolean>(false);
  user    = input<AppUser | null>(null);

  submitted = output<{ name: string; email: string; role: string; otpRequired: boolean }>();
  closed    = output<void>();

  private fb = inject(FormBuilder);

  protected isLoading = signal(false);

  protected readonly roleOptions = [
    { value: 'admin', label: 'USERS.ROLE_ADMIN' },
    { value: 'user',  label: 'USERS.ROLE_USER' },
  ];

  protected form = this.fb.group({
    name:  ['', [Validators.required, Validators.maxLength(128)]],
    email: ['', [Validators.required, Validators.email]],
    role:  ['user', Validators.required],
    otpRequired: [true],
  });

  get isEdit(): boolean { return !!this.user(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] || changes['open']) {
      const u = this.user();
      if (u) {
        this.form.patchValue({ name: u.name, email: u.email, role: u.role, otpRequired: u.otpEnabled });
        this.form.get('email')?.disable();
      } else {
        this.form.reset({ role: 'user', otpRequired: true });
        this.form.get('email')?.enable();
      }
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { name, email, role, otpRequired } = this.form.getRawValue();
    this.submitted.emit({ name: name!, email: email!, role: role!, otpRequired: !!otpRequired });
  }

  protected hasError(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!(c?.hasError(error) && c?.touched);
  }

  setLoading(value: boolean): void { this.isLoading.set(value); }

  reset(): void {
    this.form.reset({ role: 'user', otpRequired: true });
    this.isLoading.set(false);
  }
}
