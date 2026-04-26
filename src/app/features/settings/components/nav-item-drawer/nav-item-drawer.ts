import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NavItemConfig } from '../../models/nav-item-config.model';
import { DropdownComponent } from '../../../../shared/design-system/components/dropdown/dropdown.component';
import { DropdownConfig, DropdownOption, DropdownSearchFn } from '../../../../shared/design-system/models/components.model';

@Component({
  selector: 'app-nav-item-drawer',
  imports: [ReactiveFormsModule, NgIcon, TranslatePipe, DropdownComponent],
  templateUrl: './nav-item-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavItemDrawerComponent implements OnChanges {
  open = input<boolean>(false);
  navItem = input<NavItemConfig | null>(null);
  parentOptions = input<DropdownOption[]>([]);
  parentSearch = input<DropdownSearchFn | null>(null);

  submitted = output<{ type: 'basic' | 'collapsible' | 'group' | 'divider'; label: string | null; path: string | null; icon: string | null; parentId: string | null; sortOrder: number; isActive: boolean }>();
  closed = output<void>();
  deleted = output<void>();

  private readonly fb = inject(FormBuilder);

  protected readonly isLoading = signal(false);
  protected readonly parentDropdownConfig = computed<DropdownConfig>(() => ({
    minChars: 1,
    searchFn: this.parentSearch() ?? undefined,
  }));
  protected readonly typeOptions: Array<{ value: 'basic' | 'collapsible' | 'group' | 'divider'; label: string }> = [
    { value: 'basic', label: 'NAV_ITEM_CONFIG.TYPE_BASIC' },
    { value: 'collapsible', label: 'NAV_ITEM_CONFIG.TYPE_COLLAPSIBLE' },
    { value: 'group', label: 'NAV_ITEM_CONFIG.TYPE_GROUP' },
    { value: 'divider', label: 'NAV_ITEM_CONFIG.TYPE_DIVIDER' },
  ];

  protected readonly form = this.fb.group({
    type: ['basic' as 'basic' | 'collapsible' | 'group' | 'divider', Validators.required],
    label: ['', Validators.maxLength(200)],
    path: ['', Validators.maxLength(200)],
    icon: ['', Validators.maxLength(100)],
    parentId: [''],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
    isActive: [true],
  });

  get isEdit(): boolean {
    return !!this.navItem();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['navItem'] || changes['open']) {
      const current = this.navItem();
      if (current) {
        this.form.patchValue({
          type: current.type,
          label: current.label ?? '',
          path: current.path ?? '',
          icon: current.icon ?? '',
          parentId: current.parentId ?? '',
          sortOrder: current.sortOrder,
          isActive: current.isActive,
        });
      } else {
        this.reset();
      }
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      type: value.type ?? 'basic',
      label: value.label?.trim() || null,
      path: value.path?.trim() || null,
      icon: value.icon?.trim() || null,
      parentId: value.parentId?.trim() || null,
      sortOrder: value.sortOrder ?? 0,
      isActive: value.isActive ?? true,
    });
  }

  protected hasError(field: string, error: string): boolean {
    const control = this.form.get(field);
    return !!(control?.hasError(error) && control?.touched);
  }

  setLoading(value: boolean): void {
    this.isLoading.set(value);
  }

  reset(): void {
    this.isLoading.set(false);
    this.form.reset({
      type: 'basic',
      label: '',
      path: '',
      icon: '',
      parentId: '',
      sortOrder: 0,
      isActive: true,
    });
  }
}
