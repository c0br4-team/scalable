import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LeadDetail, DownpaymentMethod, PaymentPlan, PaymentPlanInstallment, SavePaymentPlanRequest } from '../../models/lead.model';
import { LeadService } from '../../services/lead.service';
import { CatalogService } from '../../../../core/http/services/catalog.service';
import { DropdownComponent } from '../../../../shared/design-system/components/dropdown/dropdown.component';
import { DropdownConfig, DropdownOption } from '../../../../shared/design-system/models/components.model';
import { ToastService } from '../../../../core/notifications/toast.service';

@Component({
  selector: 'app-lead-step2',
  templateUrl: './lead-step2.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, TranslatePipe, FormsModule, DropdownComponent],
})
export class LeadStep2Component implements OnInit {
  lead = input.required<LeadDetail>();
  planSaved = output<void>();

  private leadService = inject(LeadService);
  private catalogService = inject(CatalogService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  protected loading = signal(true);
  protected saving = signal(false);

  protected downpaymentMethods = signal<DownpaymentMethod[]>([]);

  // Form fields
  protected services = signal<string[]>([]);
  protected serviceInput = signal('');
  protected totalAmount = signal<number | null>(null);
  protected downpaymentAmount = signal<number | null>(null);
  protected downpaymentMethodId = signal<string | null>(null);
  protected installmentAmount = signal<number | null>(null);
  protected paymentDay = signal<number | null>(null);

  protected installments = signal<PaymentPlanInstallment[]>([]);
  protected planGenerated = signal(false);
  protected planSavedSignal = signal(false);

  protected methodOptions = computed<DropdownOption[]>(() =>
    this.downpaymentMethods().map(m => ({ label: m.name, value: m.id }))
  );

  protected readonly singleConfig: DropdownConfig = {};

  protected selectedMethodValue = signal<string | null>(null);

  protected canGenerate = computed(() =>
    this.services().length > 0 &&
    (this.totalAmount() ?? 0) > 0 &&
    (this.downpaymentAmount() ?? 0) >= 0 &&
    (this.installmentAmount() ?? 0) > 0 &&
    (this.paymentDay() ?? 0) >= 1 &&
    (this.paymentDay() ?? 0) <= 28
  );

  ngOnInit(): void {
    this.catalogService.getDownpaymentMethods().subscribe({
      next: methods => this.downpaymentMethods.set(methods),
    });

    const ref = this.lead().leadId ?? '';
    this.leadService.getPaymentPlan(ref).subscribe({
      next: plan => {
        if (plan) this.populateForm(plan);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private populateForm(plan: PaymentPlan): void {
    this.services.set(plan.services ?? []);
    this.totalAmount.set(plan.totalAmount);
    this.downpaymentAmount.set(plan.downpaymentAmount);
    this.downpaymentMethodId.set(plan.downpaymentMethodId);
    this.selectedMethodValue.set(plan.downpaymentMethodId);
    this.installmentAmount.set(plan.installmentAmount);
    this.paymentDay.set(plan.paymentDay);
    this.installments.set(plan.installments);
    this.planGenerated.set(plan.installments.length > 0);
    this.planSavedSignal.set(true);
  }

  protected addService(): void {
    const name = this.serviceInput().trim();
    if (!name) return;
    if (!this.services().includes(name)) {
      this.services.update(s => [...s, name]);
      this.planGenerated.set(false);
      this.planSavedSignal.set(false);
    }
    this.serviceInput.set('');
  }

  protected removeService(name: string): void {
    this.services.update(s => s.filter(x => x !== name));
    this.planGenerated.set(false);
    this.planSavedSignal.set(false);
  }

  protected onServiceKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addService();
    }
  }

  protected onMethodChange(val: string | string[]): void {
    const id = Array.isArray(val) ? (val[0] ?? null) : (val || null);
    this.downpaymentMethodId.set(id);
    this.selectedMethodValue.set(id);
  }

  protected onNumberChange(): void {
    this.planGenerated.set(false);
    this.planSavedSignal.set(false);
  }

  protected generatePlan(): void {
    const total = this.totalAmount() ?? 0;
    const down = this.downpaymentAmount() ?? 0;
    const installAmt = this.installmentAmount() ?? 0;
    const day = this.paymentDay() ?? 1;

    if (installAmt <= 0) return;

    const remaining = total - down;
    const count = remaining <= 0 ? 0 : Math.ceil(remaining / installAmt);

    const today = new Date();
    const firstDue = new Date(today.getFullYear(), today.getMonth() + 1, day);

    const list: PaymentPlanInstallment[] = [];
    let balance = remaining;

    for (let i = 1; i <= count; i++) {
      const amount = i < count ? installAmt : balance;
      balance = Math.max(0, balance - amount);
      const dueDate = new Date(firstDue);
      dueDate.setMonth(firstDue.getMonth() + (i - 1));
      list.push({
        installmentNumber: i,
        dueDate: dueDate.toISOString().slice(0, 10),
        amount: Math.round(amount * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      });
    }

    this.installments.set(list);
    this.planGenerated.set(true);
    this.planSavedSignal.set(false);
  }

  protected savePlan(): void {
    if (!this.planGenerated()) return;

    const body: SavePaymentPlanRequest = {
      services: this.services(),
      totalAmount: this.totalAmount() ?? 0,
      downpaymentAmount: this.downpaymentAmount() ?? 0,
      downpaymentMethodId: this.downpaymentMethodId(),
      installmentAmount: this.installmentAmount() ?? 0,
      paymentDay: this.paymentDay() ?? 1,
    };

    this.saving.set(true);
    const ref = this.lead().leadId ?? '';
    this.leadService.savePaymentPlan(ref, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.planSavedSignal.set(true);
        this.toast.success(this.translate.instant('LEADS.PAYMENT_PLAN_SAVED'));
        this.planSaved.emit();
      },
      error: (err) => {
        this.saving.set(false);
        const msg: string = err?.error?.error?.message ?? this.translate.instant('LEADS.PAYMENT_PLAN_SAVE_ERROR');
        this.toast.error(msg);
      },
    });
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  protected formatDate(isoDate: string): string {
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }
}
