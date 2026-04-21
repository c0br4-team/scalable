import { Component, input, output, effect, signal, inject, viewChild, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { LeadDetail, SaveLeadIntakeRequest, DependentItem } from '../../models/lead.model';
import { DropdownComponent } from '../../../../shared/design-system/components/dropdown/dropdown.component';
import { RichTextEditorComponent } from '../../../../shared/design-system/components/rich-text-editor/rich-text-editor.component';
import { EditableTableComponent } from '../../../../shared/design-system/components/table/editable-table/editable-table';
import { EditableColumnDef } from '../../../../shared/design-system/components/table/table.models';
import { DropdownConfig } from '../../../../shared/design-system/models/components.model';
import { LanguageService } from '../../../../core/http/services/language.service';
import { LegalCategoryService, LegalCategoryOption } from '../../../../core/http/services/legal-category.service';
import { LeadService } from '../../services/lead.service';
import { ToastService } from '../../../../core/notifications/toast.service';

@Component({
  selector: 'app-lead-intake-step',
  templateUrl: './lead-intake-step.html',
  imports: [FormsModule, TranslatePipe, DropdownComponent, RichTextEditorComponent, EditableTableComponent],
})
export class LeadIntakeStepComponent implements OnInit {
  lead = input.required<LeadDetail>();
  saving = input(false);
  readOnly = input(false);
  lockMessageKey = input<string | null>(null);

  saved = output<SaveLeadIntakeRequest>();
  cancelled = output<void>();
  dirtyChange = output<boolean>();
  nextStep = output<void>();
  saveAndContinue = output<SaveLeadIntakeRequest>();

  private languageService = inject(LanguageService);
  private legalCategoryService = inject(LegalCategoryService);
  private leadService = inject(LeadService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  protected categories = signal<LegalCategoryOption[]>([]);
  protected dependents = signal<DependentItem[]>([]);
  protected savingDependents = signal(false);

  protected readonly dependentColumns: EditableColumnDef<DependentItem>[] = [
    { key: 'fullName',             header: 'LEADS.DEPENDENT_NAME',     editable: true, type: 'text' },
    { key: 'identificationNumber', header: 'LEADS.DEPENDENT_ID',       editable: true, type: 'text' },
    { key: 'address',             header: 'LEADS.DEPENDENT_ADDRESS',  editable: true, type: 'text' },
    { key: 'phone',               header: 'LEADS.DEPENDENT_PHONE',    editable: true, type: 'text' },
    { key: 'email',               header: 'LEADS.DEPENDENT_EMAIL',    editable: true, type: 'text' },
    { key: 'dateOfBirth',         header: 'LEADS.DEPENDENT_DOB',      editable: true, type: 'date' },
    { key: 'countryOfBirth',      header: 'LEADS.DEPENDENT_COUNTRY',  editable: true, type: 'text' },
    { key: 'contractSigned',      header: 'LEADS.DEPENDENT_CONTRACT', editable: true, type: 'select',
      options: [{ label: 'COMMON.YES', value: 'true' }, { label: 'COMMON.NO', value: 'false' }] },
  ];

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

  submit(): void {
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

  continueNext(): void {
    const missing = this._getMissingFields();
    if (missing.length) {
      this.toast.warning(
        missing.join(', '),
        { title: this.translate.instant('LEADS.STEP1_INCOMPLETE_TITLE') }
      );
      return;
    }
    const sanitized: SaveLeadIntakeRequest = {
      ...this.form,
      dateOfBirth: this.toIsoDate(this.form.dateOfBirth),
      firstEntryDateToUSA: this.toIsoDate(this.form.firstEntryDateToUSA),
      arrestDate: this.toIsoDate(this.form.arrestDate),
    };
    const ref = this.lead().leadId ?? this.lead().rowIndex;
    const dependentsSave$ = ref != null
      ? this.leadService.saveDependents(ref, this.dependents())
      : of(undefined);
    this.savingDependents.set(true);
    dependentsSave$.subscribe({
      next: () => {
        this.savingDependents.set(false);
        this.isDirty.set(false);
        this.dirtyChange.emit(false);
        this.saveAndContinue.emit(sanitized);
      },
      error: (err) => {
        this.savingDependents.set(false);
        const msg: string = err?.error?.errors
          ? Object.values(err.error.errors).flat().join(' ')
          : (err?.error?.error?.message ?? this.translate.instant('LEADS.INTAKE_SAVE_ERROR'));
        this.toast.error(msg);
      },
    });
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
    const ref = this.lead().leadId ?? this.lead().rowIndex;
    if (ref != null) {
      this.leadService.getDependents(ref).subscribe(items => this.dependents.set(items));
    }
  }

  protected onSaveDependents(rows: DependentItem[]): void {
    const ref = this.lead().leadId ?? this.lead().rowIndex;
    if (ref == null) return;
    this.savingDependents.set(true);
    this.leadService.saveDependents(ref, rows).subscribe({
      next: () => { this.dependents.set(rows); this.savingDependents.set(false); },
      error: () => this.savingDependents.set(false),
    });
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

  /** Returns true when all required intake fields are filled and dependents are valid. */
  protected get stepOneComplete(): boolean {
    return this._getMissingFields().length === 0;
  }

  private _getMissingFields(): string[] {
    const f = this.form;
    const t = (key: string) => this.translate.instant(key);
    const missing: string[] = [];

    if (!f.fullName?.trim())               missing.push(t('LEADS.FULL_NAME'));
    if (!f.identificationNumber?.trim())   missing.push(t('LEADS.IDENTIFICATION'));
    if (!f.dateOfBirth)                    missing.push(t('LEADS.DATE_OF_BIRTH'));
    if (!f.countryOfBirth?.trim())         missing.push(t('LEADS.COUNTRY_OF_BIRTH'));
    if (!f.phone?.trim())                  missing.push(t('LEADS.PHONE'));
    if (!f.email?.trim())                  missing.push(t('LEADS.EMAIL'));
    if (!f.address?.trim())                missing.push(t('LEADS.ADDRESS'));
    if (!f.zipCode?.trim())                missing.push(t('LEADS.ZIP'));
    if (!f.maritalStatus)                  missing.push(t('LEADS.MARITAL_STATUS'));
    if (!f.firstEntryDateToUSA)            missing.push(t('LEADS.FIRST_ENTRY_USA'));
    if (f.hasEnteredMultipleTimes == null)  missing.push(t('LEADS.ENTERED_MULTIPLE'));
    if (f.hasBeenArrested == null)         missing.push(t('LEADS.ARRESTED'));
    if (!f.currentMigrationStatus?.trim()) missing.push(t('LEADS.MIGRATION_STATUS'));
    if (!f.preferredLanguage?.trim())      missing.push(t('LEADS.PREFERRED_LANGUAGE'));
    if (!f.history?.trim())                missing.push(t('LEADS.HISTORY'));

    this.dependents().forEach((d, i) => {
      const n = i + 1;
      if (!d.fullName?.trim())
        missing.push(`${t('LEADS.SECTION_DEPENDENTS')} #${n}: ${t('LEADS.DEPENDENT_NAME')}`);
      if (!d.identificationNumber?.trim())
        missing.push(`${t('LEADS.SECTION_DEPENDENTS')} #${n}: ${t('LEADS.DEPENDENT_ID')}`);
      if (!d.dateOfBirth?.trim())
        missing.push(`${t('LEADS.SECTION_DEPENDENTS')} #${n}: ${t('LEADS.DEPENDENT_DOB')}`);
      if (d.contractSigned !== 'true' && d.contractSigned !== 'false')
        missing.push(`${t('LEADS.SECTION_DEPENDENTS')} #${n}: ${t('LEADS.DEPENDENT_CONTRACT')}`);
    });

    return missing;
  }
}
