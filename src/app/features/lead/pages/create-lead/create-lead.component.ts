import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIconComponent } from '@ng-icons/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { LeadService } from '../../services/lead.service';
import { UsersService } from '../../../../core/http/services/users.service';
import { ToastService } from '../../../../core/notifications/toast.service';
import { DropdownComponent } from '../../../../shared/design-system/components/dropdown/dropdown.component';
import { RichTextEditorComponent } from '../../../../shared/design-system/components/rich-text-editor/rich-text-editor.component';
import { DropdownConfig } from '../../../../shared/design-system/models/components.model';

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
  private readonly fb = inject(FormBuilder);

  protected readonly submitting = signal(false);

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
    this.router.navigate(['/leads/manual']);
  }
}
