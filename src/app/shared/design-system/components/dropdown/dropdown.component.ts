import { Component, forwardRef, Input, signal, computed, ElementRef, viewChild, OnInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ClickOutsideDirective } from '../../../../core/directives/click-outside.directive';
import { DropdownOption, DropdownConfig } from '../../models/components.model';
import { DropdownSearchService } from '../../services/dropdown-search.service';

@Component({
  selector: 'sce-dropdown',
  templateUrl: './dropdown.component.html',
  standalone: true,
  imports: [ClickOutsideDirective],
  providers: [
    DropdownSearchService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true,
    },
  ],
})
export class DropdownComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() options: DropdownOption[] = [];
  @Input() placeholder: string = 'Select';
  @Input() config: DropdownConfig = {};
  @Input() maxVisibleChips: number = 2;

  protected searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected isOpen = signal(false);
  protected isDisabled = signal(false);
  protected searchQuery = signal('');
  protected selectedOption = signal<DropdownOption | null>(null);
  protected selectedOptions = signal<DropdownOption[]>([]);

  protected get isRemote(): boolean { return !!this.config.searchFn; }
  protected get isSearchable(): boolean { return this.isRemote || !!this.config.searchable; }
  protected get isMultiple(): boolean { return !!this.config.multiple; }

  protected visibleOptions = computed(() => {
    if (this.isRemote) return this.searchService.results();
    const q = this.searchQuery().toLowerCase().trim();
    return q ? this.options.filter(o => o.label.toLowerCase().includes(q)) : this.options;
  });

  // Opciones seleccionadas que NO están en visibleOptions (para mostrarlas fijas al tope)
  protected pinnedSelected = computed(() => {
    if (!this.isMultiple) return [];
    const visible = this.visibleOptions().map(o => o.value);
    return this.selectedOptions().filter(o => !visible.includes(o.value));
  });

  protected displayLabel = computed(() => {
    if (this.isMultiple) {
      const selected = this.selectedOptions();
      if (!selected.length) return null;
      const [first, ...rest] = selected;
      return rest.length ? `${first.label}, +${rest.length}` : first.label;
    }
    return this.selectedOption()?.label ?? null;
  });

  private onChange: (value: string | null | string[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(protected searchService: DropdownSearchService) {}

  ngOnInit(): void {
    if (this.isRemote) {
      this.searchService.configure(
        this.config.searchFn!,
        this.config.debounceMs,
        this.config.minChars,
      );
    }
  }

  ngOnDestroy(): void { this.searchService.destroy(); }

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.isOpen.update(v => !v);
    if (this.isOpen() && this.isSearchable) {
      setTimeout(() => this.searchInput()?.nativeElement.focus(), 0);
    }
    if (!this.isOpen()) this.closeCleanup();
  }

  protected close(): void {
    this.isOpen.set(false);
    this.closeCleanup();
  }

  private closeCleanup(): void {
    this.searchQuery.set('');
    if (this.isRemote) this.searchService.reset();
  }

  protected onSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.searchQuery.set(q);
    if (this.isRemote) this.searchService.search(q);
  }

  protected isSelected(option: DropdownOption): boolean {
    return this.isMultiple
      ? this.selectedOptions().some(o => o.value === option.value)
      : this.selectedOption()?.value === option.value;
  }

  protected get allSelected(): boolean {
    const visible = this.visibleOptions();
    return visible.length > 0 && visible.every(o => this.isSelected(o));
  }

  protected toggleAll(): void {
    const visible = this.visibleOptions();
    const current = this.selectedOptions();
    const updated = this.allSelected
      ? current.filter(o => !visible.some(v => v.value === o.value))
      : [...current, ...visible.filter(v => !current.some(c => c.value === v.value))];
    this.selectedOptions.set(updated);
    this.onChange(updated.map(o => o.value));
    this.onTouched();
  }

  protected removeOption(option: DropdownOption, event: Event): void {
    event.stopPropagation();
    const updated = this.selectedOptions().filter(o => o.value !== option.value);
    this.selectedOptions.set(updated);
    this.onChange(updated.map(o => o.value));
    this.onTouched();
  }

  protected clearAll(event: Event): void {
    event.stopPropagation();
    if (this.isMultiple) {
      this.selectedOptions.set([]);
      this.onChange([]);
    } else {
      this.selectedOption.set(null);
      this.onChange(null);
    }
    this.onTouched();
  }

  protected select(option: DropdownOption): void {
    this.onTouched();
    if (!this.isMultiple) {
      this.selectedOption.set(option);
      this.onChange(option.value);
      this.close();
      return;
    }
    const current = this.selectedOptions();
    const exists = current.some(o => o.value === option.value);
    const updated = exists
      ? current.filter(o => o.value !== option.value)
      : [...current, option];
    this.selectedOptions.set(updated);
    this.onChange(updated.map(o => o.value));
  }

  writeValue(value: string | string[] | null): void {
    if (this.isMultiple) {
      const values = Array.isArray(value) ? value : [];
      this.selectedOptions.set(this.options.filter(o => values.includes(o.value)));
    } else {
      this.selectedOption.set(this.options.find(o => o.value === value) ?? null);
    }
  }

  registerOnChange(fn: (value: string | null | string[]) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.isDisabled.set(disabled); }
}
