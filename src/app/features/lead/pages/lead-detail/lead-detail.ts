import { ChangeDetectionStrategy, Component, inject, signal, computed, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LeadService } from '../../services/lead.service';
import { LeadDetail, SaveLeadIntakeRequest } from '../../models/lead.model';
import { LeadIntakeStepComponent } from '../../components/lead-intake-step/lead-intake-step';
import { StepperComponent } from '../../../../shared/design-system/components/stepper/stepper.component';
import { DropdownConfig, DropdownOption, StepItem } from '../../../../shared/design-system/models/components.model';
import { ToastService } from '../../../../core/notifications/toast.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { BreadcrumbService } from '../../../../core/navigation/breadcrumb.service';
import { DropdownComponent } from '../../../../shared/design-system/components/dropdown/dropdown.component';
import { UsersService } from '../../../../core/http/services/users.service';

@Component({
  selector: 'app-lead-detail',
  templateUrl: './lead-detail.html',
  host: { class: 'flex flex-col flex-1 overflow-hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, DatePipe, FormsModule, TranslatePipe, LeadIntakeStepComponent, StepperComponent, DropdownComponent],
})
export class LeadDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private leadService = inject(LeadService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private auth = inject(AuthService);
  private breadcrumbs = inject(BreadcrumbService);
  private users = inject(UsersService);

  protected lead = signal<LeadDetail | null>(null);
  protected loading = signal(true);
  protected saving = signal(false);
  protected assigning = signal(false);
  protected currentStep = signal(1);
  protected totalSteps = 1;
  protected stepDirty = signal(false);
  protected selectedAssignedUserId = signal<string | null>(null);

  protected isConverted = computed(() => this.lead()?.status === 'converted');
  protected savedAt = computed(() => this.lead()?.intake?.updatedAt ?? null);
  protected hasAssignedUser = computed(() => !!this.lead()?.assignedUserIdAw);
  protected canEditIntake = computed(() => {
    if (this.isConverted()) {
      return false;
    }

    const currentUserId = this.auth.user()?.id ?? null;
    const assignedUserId = this.lead()?.assignedUserIdAw ?? null;
    return !!assignedUserId && assignedUserId === currentUserId;
  });
  protected canManageAssignee = computed(() => {
    const currentUserId = this.auth.user()?.id ?? null;
    const assignedUserId = this.lead()?.assignedUserIdAw ?? null;
    return !assignedUserId || assignedUserId === currentUserId;
  });
  protected lockMessageKey = computed(() => {
    if (this.isConverted()) {
      return 'LEADS.CONVERTED_READONLY';
    }

    if (!this.hasAssignedUser()) {
      return 'LEADS.ASSIGN_REQUIRED_TO_EDIT';
    }

    if (!this.canEditIntake()) {
      return 'LEADS.ONLY_ASSIGNED_CAN_EDIT';
    }

    return null;
  });

  protected readonly userSearchConfig: DropdownConfig = {
    searchFn: (q: string) => this.users.search(q),
    debounceMs: 300,
    minChars: 0,
  };

  protected assignedUserOptions = computed<DropdownOption[]>(() => {
    const lead = this.lead();
    if (!lead?.assignedUserIdAw || !lead.assignedUserName) {
      return [];
    }

    return [{ label: lead.assignedUserName, value: lead.assignedUserIdAw }];
  });

  protected steps = computed<StepItem[]>(() => [
    { index: 1, label: 'LEADS.STEP_1', completed: this.lead()?.intake != null },
  ]);

  protected get leadRef(): string {
    return this.route.snapshot.paramMap.get('leadRef') ?? '';
  }

  protected get rowIndex(): number | null {
    const current = this.lead()?.rowIndex;
    if (current != null) {
      return current;
    }

    const parsed = Number(this.leadRef);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private get breadcrumbPath(): string {
    return `/leads/${this.leadRef}`;
  }

  private get leadRequestRef(): string {
    return this.lead()?.leadId ?? this.leadRef;
  }

  private get backRoute(): string[] {
    const navigationSource = history.state?.['fromListSource'];
    const isManual = navigationSource === 'manual' || this.lead()?.sourceStatus === 'manual';
    return isManual ? ['/leads/manual'] : ['/leads/imported'];
  }

  protected statusCls = computed(() => {
    const s = this.lead()?.status ?? 'new';
    return {
      new:         'bg-blue-100 text-blue-700',
      in_progress: 'bg-amber-100 text-amber-700',
      converted:   'bg-green-100 text-green-700',
    }[s] ?? 'bg-gray-100 text-gray-500';
  });

  protected statusLabel = computed(() => ({
    new:         'LEADS.STATUS_NEW',
    in_progress: 'LEADS.STATUS_IN_PROGRESS',
    converted:   'LEADS.STATUS_CONVERTED',
  }[this.lead()?.status ?? 'new'] ?? 'LEADS.STATUS_NEW'));

  protected sourceCls = computed(() => ({
    active: 'bg-emerald-50 text-emerald-700',
    removed_from_source: 'bg-rose-50 text-rose-700',
    legacy: 'bg-slate-100 text-slate-600',
    manual: 'bg-violet-50 text-violet-700',
  }[this.lead()?.sourceStatus ?? 'legacy'] ?? 'bg-slate-100 text-slate-600'));

  protected sourceLabel = computed(() => ({
    active: 'LEADS.SOURCE_ACTIVE',
    removed_from_source: 'LEADS.SOURCE_REMOVED',
    legacy: 'LEADS.SOURCE_LEGACY',
    manual: 'LEADS.SOURCE_MANUAL',
  }[this.lead()?.sourceStatus ?? 'legacy'] ?? 'LEADS.SOURCE_LEGACY'));

  ngOnInit(): void {
    const navigationName = typeof history.state?.['leadName'] === 'string'
      ? history.state['leadName'].trim()
      : '';

    if (navigationName) {
      this.breadcrumbs.setLabel(this.breadcrumbPath, navigationName);
    }

    this.leadService.getLeadDetail(this.leadRef).subscribe({
      next: (lead) => {
        this.lead.set(lead);
        this.selectedAssignedUserId.set(lead.assignedUserIdAw ?? null);
        this.breadcrumbs.setLabel(
          this.breadcrumbPath,
          lead.fullName?.trim() || this.translate.instant('LEADS.DETAIL_LEAD'));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.breadcrumbs.clearLabel(this.breadcrumbPath);
        this.router.navigate(this.backRoute);
      },
    });
  }

  ngOnDestroy(): void {
    this.breadcrumbs.clearLabel(this.breadcrumbPath);
  }

  protected onIntakeSaved(request: SaveLeadIntakeRequest): void {
    const withUser: SaveLeadIntakeRequest = { ...request, assignedUserIdAw: this.auth.user()?.id ?? null };
    this.saving.set(true);
    this.leadService.saveIntake(this.leadRequestRef, withUser).subscribe({
      next: () => {
        this.saving.set(false);
        this.leadService.getLeadDetail(this.leadRequestRef).subscribe(lead => {
          this.lead.set(lead);
          this.selectedAssignedUserId.set(lead.assignedUserIdAw ?? null);
          this.breadcrumbs.setLabel(
            this.breadcrumbPath,
            lead.fullName?.trim() || this.translate.instant('LEADS.DETAIL_LEAD'));
          this.toast.success(this.translate.instant('LEADS.INTAKE_SAVED_OK'));
        });
      },
      error: (err) => {
        this.saving.set(false);
        const msg: string = err?.error?.error?.message
          ?? this.translate.instant('LEADS.INTAKE_SAVE_ERROR');
        this.toast.error(msg);
      },
    });
  }

  protected onDirtyChange(dirty: boolean): void {
    this.stepDirty.set(dirty);
  }

  protected updateAssignedUser(): void {
    if (this.assigning() || !this.canManageAssignee()) {
      return;
    }

    const assignedUserIdAw = this.selectedAssignedUserId();
    if (!assignedUserIdAw || assignedUserIdAw === this.lead()?.assignedUserIdAw) {
      return;
    }

    this.assigning.set(true);
    this.leadService.updateAssignedUser(this.leadRequestRef, assignedUserIdAw).subscribe({
      next: () => {
        this.assigning.set(false);
        this.stepDirty.set(false);
        this.toast.success(this.translate.instant('LEADS.ASSIGNEE_UPDATED'));
        this.router.navigate(this.backRoute, { replaceUrl: true });
      },
      error: (err) => {
        this.assigning.set(false);
        const msg: string = err?.error?.error?.message
          ?? this.translate.instant('LEADS.ASSIGNEE_UPDATE_ERROR');
        this.toast.error(msg);
      },
    });
  }

  protected goBack(): void {
    if (this.stepDirty() && !confirm(this.translate.instant('LEADS.UNSAVED_CHANGES_WARNING'))) {
      return;
    }
    this.router.navigate(this.backRoute);
  }
}
