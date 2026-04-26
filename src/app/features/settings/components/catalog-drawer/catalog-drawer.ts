import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CatalogConfig } from '../../models/catalog-config.model';

@Component({
  selector: 'app-catalog-drawer',
  imports: [ReactiveFormsModule, NgIcon, TranslatePipe],
  templateUrl: './catalog-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogDrawerComponent implements OnChanges {
  open    = input<boolean>(false);
  catalog = input<CatalogConfig | null>(null);

  submitted = output<{ tableName: string; keyField: string; valueField: string; conditions: string | null; description: string | null }>();
  closed    = output<void>();

  private fb = inject(FormBuilder);

  protected isLoading = signal(false);

  protected form = this.fb.group({
    tableName:   ['', [Validators.required, Validators.maxLength(128)]],
    keyField:    ['', [Validators.required, Validators.maxLength(128)]],
    valueField:  ['', [Validators.required, Validators.maxLength(128)]],
    conditions:  [''],
    description: [''],
  });

  get isEdit(): boolean { return !!this.catalog(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['catalog'] || changes['open']) {
      const c = this.catalog();
      if (c) {
        this.form.patchValue({
          tableName:   c.tableName,
          keyField:    c.keyField,
          valueField:  c.valueField,
          conditions:  c.conditions ?? '',
          description: c.description ?? '',
        });
      } else {
        this.form.reset();
      }
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.submitted.emit({
      tableName:   v.tableName!,
      keyField:    v.keyField!,
      valueField:  v.valueField!,
      conditions:  v.conditions?.trim() || null,
      description: v.description?.trim() || null,
    });
  }

  protected hasError(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!(c?.hasError(error) && c?.touched);
  }

  setLoading(value: boolean): void { this.isLoading.set(value); }
  reset(): void { this.form.reset(); this.isLoading.set(false); }
}
