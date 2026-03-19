import { Component, input, output, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppUser } from '../../models/user.model';

@Component({
  selector: 'app-user-drawer',
  imports: [ReactiveFormsModule, NgIcon, TranslatePipe],
  templateUrl: './user-drawer.html',
})
export class UserDrawerComponent implements OnChanges {
  open    = input<boolean>(false);
  user    = input<AppUser | null>(null);

  submitted = output<{ name: string; email: string; role: string }>();
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
  });

  get isEdit(): boolean { return !!this.user(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] || changes['open']) {
      const u = this.user();
      if (u) {
        this.form.patchValue({ name: u.name, email: u.email, role: u.role });
        this.form.get('email')?.disable();
        this.form.get('password')?.disable();
      } else {
        this.form.reset({ role: 'user' });
        this.form.get('email')?.enable();
        this.form.get('password')?.enable();
      }
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { name, email, role } = this.form.getRawValue();
    this.submitted.emit({ name: name!, email: email!, role: role! });
  }

  protected hasError(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!(c?.hasError(error) && c?.touched);
  }

  setLoading(value: boolean): void { this.isLoading.set(value); }

  reset(): void {
    this.form.reset({ role: 'user' });
    this.isLoading.set(false);
  }
}
