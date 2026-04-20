import { Component, input, output, effect, signal, inject, viewChild, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LeadDetail, SaveLeadIntakeRequest } from '../../models/lead.model';
import { DropdownComponent } from '../../../../shared/design-system/components/dropdown/dropdown.component';
import { RichTextEditorComponent } from '../../../../shared/design-system/components/rich-text-editor/rich-text-editor.component';
import { DropdownConfig } from '../../../../shared/design-system/models/components.model';
import { LanguageService } from '../../../../core/http/services/language.service';
import { LegalCategoryService, LegalCategoryOption } from '../../../../core/http/services/legal-category.service';

@Component({
  selector: 'app-lead-intake-step',
  templateUrl: './lead-intake-step.html',
  imports: [FormsModule, NgIcon, TranslatePipe, DropdownComponent, RichTextEditorComponent],
})
export class LeadIntakeStepComponent implements OnInit {
  lead = input.required<LeadDetail>();
  saving = input(false);
  readOnly = input(false);
  lockMessageKey = input<string | null>(null);

  saved = output<SaveLeadIntakeRequest>();
  cancelled = output<void>();
  dirtyChange = output<boolean>();

  private languageService = inject(LanguageService);
  private legalCategoryService = inject(LegalCategoryService);

  protected categories = signal<LegalCategoryOption[]>([]);

  protected readonly formRef = viewChild<NgForm>('intakeForm');
  protected isDirty = signal(false);

  protected readonly languageConfig: DropdownConfig = {
    searchFn: (q: string) => this.languageService.search(q),
    debounceMs: 300,
    minChars: 1,
  };

  protected form: SaveLeadIntakeRequest = {
    fullName: '',
    identificationNumber: null,
    dateOfBirth: null,
    countryOfBirth: null,
    phone: null,
    email: null,
    address: null,
    zipCode: null,
    maritalStatus: null,
    firstEntryDateToUSA: null,
    hasEnteredMultipleTimes: null,
    hasBeenArrested: null,
    arrestDate: null,
    hasBeenMarriedToUSCitizen: null,
    hasChildrenWithUSStatus: null,
    currentMigrationStatus: null,
    preferredLanguage: null,
    history: null,
    legalCategoryIds: [],
    assignedUserIdAw: null,
  };

  constructor() {
    effect(() => {
      const lead = this.lead();
      if (lead.intake) {
        const i = lead.intake;
        this.form = {
          fullName: i.fullName,
          identificationNumber: i.identificationNumber,
          dateOfBirth: i.dateOfBirth,
          countryOfBirth: i.countryOfBirth,
          phone: i.phone,
          email: i.email,
          address: i.address,
          zipCode: i.zipCode,
          maritalStatus: i.maritalStatus,
          firstEntryDateToUSA: i.firstEntryDateToUSA,
          hasEnteredMultipleTimes: i.hasEnteredMultipleTimes,
          hasBeenArrested: i.hasBeenArrested,
          arrestDate: i.arrestDate,
          hasBeenMarriedToUSCitizen: i.hasBeenMarriedToUSCitizen,
          hasChildrenWithUSStatus: i.hasChildrenWithUSStatus,
          currentMigrationStatus: i.currentMigrationStatus,
          preferredLanguage: i.preferredLanguage,
          history: i.history,
          legalCategoryIds: i.legalCategoryIds,
          assignedUserIdAw: null,
        };
      } else {
        this.form.fullName = lead.fullName ?? '';
        this.form.identificationNumber = lead.identificationNumber;
        this.form.dateOfBirth = this.toIsoDate(lead.dateOfBirth);
        this.form.countryOfBirth = lead.countryOfBirth;
        this.form.phone = lead.phone;
        this.form.email = lead.email;
        if (lead.addressZip) this.form.address = lead.addressZip;
      }
    });
  }

  /** Ensures a date value is in yyyy-MM-dd format; returns null otherwise. */
  private toIsoDate(value: string | null | undefined): string | null {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // Attempt to parse (handles MM/DD/YYYY, long-form, etc. from Google Sheets)
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  protected submit(): void {
    const form = this.formRef();
    if (form?.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    const sanitized: SaveLeadIntakeRequest = {
      ...this.form,
      dateOfBirth: this.toIsoDate(this.form.dateOfBirth),
      firstEntryDateToUSA: this.toIsoDate(this.form.firstEntryDateToUSA),
      arrestDate: this.toIsoDate(this.form.arrestDate),
    };
    this.isDirty.set(false);
    this.dirtyChange.emit(false);
    this.saved.emit(sanitized);
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  protected markDirty(): void {
    if (!this.isDirty()) {
      this.isDirty.set(true);
      this.dirtyChange.emit(true);
    }
  }

  protected setMaritalStatus(v: string): void {
    this.form.maritalStatus = this.form.maritalStatus === v ? null : v;
    this.markDirty();
  }

  protected setBool(field: keyof SaveLeadIntakeRequest, v: boolean): void {
    (this.form as any)[field] = (this.form as any)[field] === v ? null : v;
    this.markDirty();
  }

  ngOnInit(): void {
    this.legalCategoryService.getAll().subscribe(cats => this.categories.set(cats));
  }

  protected isCategorySelected(code: string): boolean {
    return this.form.legalCategoryIds.includes(code);
  }

  protected toggleCategory(code: string): void {
    const ids = this.form.legalCategoryIds;
    this.form.legalCategoryIds = ids.includes(code)
      ? ids.filter(c => c !== code)
      : [...ids, code];
    this.markDirty();
  }
}
