import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIconComponent } from '@ng-icons/core';
import * as XLSX from 'xlsx';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { LeadService } from '../../../../core/http/services/lead.service';
import { UsersService } from '../../../../core/http/services/users.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/http/services/auth.service';
import { DropdownComponent } from '../../../../shared/design-system/components/dropdown/dropdown.component';
import { RichTextEditorComponent } from '../../../../shared/design-system/components/rich-text-editor/rich-text-editor.component';
import { DropdownConfig } from '../../../../shared/design-system/models/components.model';
import { BulkCreateLeadItemRequest } from '../../models/lead.model';

interface LeadUploadPreviewRow extends BulkCreateLeadItemRequest {
  rowNumber: number;
}

@Component({
  selector: 'app-create-lead',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col flex-1 overflow-hidden' },
  imports: [ReactiveFormsModule, TranslatePipe, NgIconComponent, DropdownComponent, RichTextEditorComponent],
  templateUrl: './create-lead.component.html',
})
export class CreateLeadComponent {
  private readonly router = inject(Router);
  private readonly leads = inject(LeadService);
  private readonly users = inject(UsersService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly submitting = signal(false);
  protected readonly importSubmitting = signal(false);
  protected readonly isUploadModalOpen = signal(false);
  protected readonly isParsingUpload = signal(false);
  protected readonly isDragActive = signal(false);
  protected readonly uploadErrorKey = signal<string | null>(null);
  protected readonly selectedUploadFile = signal<File | null>(null);
  protected readonly bulkPreviewRows = signal<LeadUploadPreviewRow[]>([]);
  protected readonly isMarketingUser = computed(() => this.auth.user()?.role?.toLowerCase() === 'marketing');
  protected readonly selectedUploadFileName = computed(() => this.selectedUploadFile()?.name ?? null);

  private readonly trimmedRequired = (control: AbstractControl<string | null>): ValidationErrors | null => {
    return (control.value ?? '').trim().length > 0 ? null : { required: true };
  };

  protected readonly form = this.fb.group({
    fullName: this.fb.nonNullable.control('', { validators: [this.trimmedRequired] }),
    phone: this.fb.nonNullable.control('', { validators: [this.trimmedRequired] }),
    email: this.fb.nonNullable.control('', { validators: [Validators.email] }),
    assignedUserIdAw: this.fb.control<string | null>(null),
    history: this.fb.nonNullable.control(''),
  });

  protected readonly controls = this.form.controls;

  protected readonly userSearchConfig: DropdownConfig = {
    searchFn: (q: string) => this.users.search(q),
    debounceMs: 300,
    minChars: 0,
  };

  protected onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { fullName, phone, email, assignedUserIdAw, history } = this.form.getRawValue();

    this.submitting.set(true);
    const trimmedFullName = fullName.trim();

    this.leads.createLead({
      fullName: trimmedFullName,
      phone: phone.trim(),
      email: email.trim() || null,
      assignedUserIdAw,
      history: history.trim() || null,
    }).subscribe({
      next: res => {
        this.toast.success('LEADS.CREATE_SUCCESS');
        this.router.navigate(['/leads', res.leadId], {
          state: { leadName: trimmedFullName, fromListSource: 'manual' },
        });
      },
      error: () => {
        this.toast.error('LEADS.CREATE_ERROR');
        this.submitting.set(false);
      },
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/leads']);
  }

  protected openUploadModal(): void {
    this.selectedUploadFile.set(null);
    this.uploadErrorKey.set(null);
    this.isDragActive.set(false);
    this.isUploadModalOpen.set(true);
  }

  protected closeUploadModal(): void {
    this.isUploadModalOpen.set(false);
    this.selectedUploadFile.set(null);
    this.uploadErrorKey.set(null);
    this.isDragActive.set(false);
  }

  protected downloadTemplate(): void {
    const worksheet = XLSX.utils.aoa_to_sheet([['name', 'email', 'phone']]);
    worksheet['!cols'] = [{ wch: 28 }, { wch: 32 }, { wch: 20 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, 'lead-import-template.xlsx');
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.assignUploadFile(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.assignUploadFile(file);
  }

  protected async loadUploadFile(): Promise<void> {
    const file = this.selectedUploadFile();
    if (!file || this.isParsingUpload()) {
      return;
    }

    this.isParsingUpload.set(true);
    this.uploadErrorKey.set(null);

    try {
      const rows = await this.parseUploadFile(file);
      this.bulkPreviewRows.set(rows);
      this.closeUploadModal();
    } catch {
      this.uploadErrorKey.set('LEADS.UPLOAD_PARSE_ERROR');
      this.toast.error('LEADS.UPLOAD_PARSE_ERROR');
    } finally {
      this.isParsingUpload.set(false);
    }
  }

  protected clearBulkPreview(): void {
    this.bulkPreviewRows.set([]);
    this.importSubmitting.set(false);
  }

  protected createBulkLeads(): void {
    const items = this.bulkPreviewRows().map(({ name, email, phone }) => ({ name, email, phone }));
    if (items.length === 0 || this.importSubmitting()) {
      return;
    }

    this.importSubmitting.set(true);
    this.leads.bulkCreateLeads({ items })
      .pipe(finalize(() => this.importSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('LEADS.BULK_CREATE_ACCEPTED');
          this.bulkPreviewRows.set([]);
          this.router.navigate(['/leads']);
        },
        error: () => {
          this.toast.error('LEADS.BULK_CREATE_ERROR');
        },
      });
  }

  private assignUploadFile(file: File | null): void {
    if (!file) {
      return;
    }

    if (!this.isSupportedUploadFile(file.name)) {
      this.selectedUploadFile.set(null);
      this.uploadErrorKey.set('LEADS.UPLOAD_INVALID_FILE');
      this.toast.error('LEADS.UPLOAD_INVALID_FILE');
      return;
    }

    this.selectedUploadFile.set(file);
    this.uploadErrorKey.set(null);
  }

  private async parseUploadFile(file: File): Promise<LeadUploadPreviewRow[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;

    if (!worksheet) {
      throw new Error('Missing worksheet');
    }

    const rawRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
      raw: false,
    });

    if (rawRows.length === 0) {
      this.uploadErrorKey.set('LEADS.UPLOAD_EMPTY_FILE');
      this.toast.error('LEADS.UPLOAD_EMPTY_FILE');
      throw new Error('Empty file');
    }

    const header = rawRows[0].map(value => String(value ?? '').trim().toLowerCase());
    const nameIndex = header.indexOf('name');
    const emailIndex = header.indexOf('email');
    const phoneIndex = header.indexOf('phone');

    if (nameIndex < 0 || emailIndex < 0 || phoneIndex < 0) {
      this.uploadErrorKey.set('LEADS.UPLOAD_INVALID_HEADERS');
      this.toast.error('LEADS.UPLOAD_INVALID_HEADERS');
      throw new Error('Invalid headers');
    }

    const previewRows = rawRows
      .slice(1)
      .map((row, index) => ({
        rowNumber: index + 2,
        name: this.normalizeCellValue(row[nameIndex]),
        email: this.normalizeOptionalCellValue(row[emailIndex]),
        phone: this.normalizeOptionalCellValue(row[phoneIndex]),
      }))
      .filter(row => row.name || row.email || row.phone);

    if (previewRows.length === 0) {
      this.uploadErrorKey.set('LEADS.UPLOAD_EMPTY_FILE');
      this.toast.error('LEADS.UPLOAD_EMPTY_FILE');
      throw new Error('No rows');
    }

    const hasInvalidRows = previewRows.some(row => !row.name);
    if (hasInvalidRows) {
      this.uploadErrorKey.set('LEADS.UPLOAD_INVALID_ROW');
      this.toast.error('LEADS.UPLOAD_INVALID_ROW');
      throw new Error('Invalid row');
    }

    return previewRows;
  }

  private normalizeCellValue(value: string | number | null | undefined): string {
    return String(value ?? '').trim();
  }

  private normalizeOptionalCellValue(value: string | number | null | undefined): string | null {
    const normalized = this.normalizeCellValue(value);
    return normalized.length > 0 ? normalized : null;
  }

  private isSupportedUploadFile(fileName: string): boolean {
    return /\.(xlsx|xls|csv)$/i.test(fileName);
  }
}
