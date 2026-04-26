import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CatalogService } from '../../../../core/http/services/catalog.service';
import { DropdownComponent } from '../../../../shared/design-system/components/dropdown/dropdown.component';
import { DropdownConfig, DropdownOption } from '../../../../shared/design-system/models/components.model';
import { AppUser } from '../../models/user.model';

@Component({
  selector: 'app-user-drawer',
  imports: [ReactiveFormsModule, NgIcon, TranslatePipe, DropdownComponent],
  templateUrl: './user-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDrawerComponent implements OnChanges {
  open    = input<boolean>(false);
  user    = input<AppUser | null>(null);

  submitted = output<{ name: string; email: string; role: string; otpRequired: boolean }>();
  closed    = output<void>();

  private fb = inject(FormBuilder);
  private catalogs = inject(CatalogService);
  private readonly roleCatalogId = 1;

  protected isLoading = signal(false);
  protected readonly roleOptions = signal<DropdownOption[]>([]);
  protected readonly roleConfig: DropdownConfig = {
    searchFn: this.catalogs.createSearchFn(this.roleCatalogId, 20),
    debounceMs: 250,
    minChars: 0,
  };

  protected form = this.fb.group({
    name:  ['', [Validators.required, Validators.maxLength(128)]],
    email: ['', [Validators.required, Validators.email]],
    role:  ['user', Validators.required],
    otpRequired: [true],
  });

  get isEdit(): boolean { return !!this.user(); }

  ngOnChanges(changes: SimpleChanges): void {
    this.ensureRoleOptionsLoaded();

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

  private ensureRoleOptionsLoaded(): void {
    if (this.roleOptions().length) return;

    this.catalogs.query(this.roleCatalogId, '', 20).subscribe({
      next: items => this.roleOptions.set(items.map(item => ({ label: item.value, value: item.key }))),
      error: () => this.roleOptions.set([]),
    });
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
