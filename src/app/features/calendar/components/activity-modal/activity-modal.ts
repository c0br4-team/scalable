import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import {
  Activity, ActivityPriority, ActivityStatus, ActivityType, Assignee
} from '../../models/activity.model';
import { ActivityService } from '../../../../core/http/services/activity.service';
import { AuthService } from '../../../../core/http/services/auth.service';

@Component({
  selector: 'app-activity-modal',
  imports: [ReactiveFormsModule, NgIcon],
  templateUrl: './activity-modal.html',
})
export class ActivityModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private activityService = inject(ActivityService);
  private auth = inject(AuthService);

  activity    = input<Activity | null>(null);
  defaultDate = input<Date | null>(null);
  saved = output<void>();
  cancelled = output<void>();

  protected mode = computed(() => this.activity() ? 'edit' : 'create');
  protected showAssigneeForm = signal(false);
  protected assignees = signal<Assignee[]>([]);

  // ── Time picker state ───────────────────────────────────────────────────────
  protected activeTimePicker = signal<'start' | 'due' | null>(null);
  protected startHour   = signal(9);
  protected startMinute = signal(0);
  protected startPeriod = signal<'AM' | 'PM'>('AM');
  protected dueHour     = signal(5);
  protected dueMinute   = signal(0);
  protected duePeriod   = signal<'AM' | 'PM'>('PM');

  protected readonly hours12       = [1,2,3,4,5,6,7,8,9,10,11,12];
  protected readonly minuteOptions = [0,5,10,15,20,25,30,35,40,45,50,55];

  protected readonly types: { value: ActivityType; label: string }[] = [
    { value: 'meeting',  label: 'Reunión' },
    { value: 'task',     label: 'Tarea' },
    { value: 'reminder', label: 'Recordatorio' },
    { value: 'deadline', label: 'Fecha límite' },
    { value: 'event',    label: 'Evento' },
  ];

  protected readonly priorities: { value: ActivityPriority; label: string }[] = [
    { value: 'low',      label: 'Baja' },
    { value: 'medium',   label: 'Media' },
    { value: 'high',     label: 'Alta' },
    { value: 'critical', label: 'Crítica' },
  ];

  protected readonly statuses: { value: ActivityStatus; label: string }[] = [
    { value: 'pending',     label: 'Pendiente' },
    { value: 'in-progress', label: 'En progreso' },
    { value: 'completed',   label: 'Completado' },
    { value: 'cancelled',   label: 'Cancelado' },
  ];

  protected form = this.fb.group({
    title:         ['', [Validators.required, Validators.minLength(3)]],
    type:          ['task' as ActivityType, Validators.required],
    status:        ['pending' as ActivityStatus, Validators.required],
    priority:      ['medium' as ActivityPriority, Validators.required],
    dueDate:       ['', Validators.required],
    notes:         [''],
    checklist:     this.fb.array([]),
    assigneeEmail: ['', Validators.email],
  });

  protected get checklistArray(): FormArray {
    return this.form.get('checklist') as FormArray;
  }

  ngOnInit(): void {
    const activity = this.activity();
    const def = this.defaultDate();
    if (!activity && def) {
      this.form.patchValue({
        dueDate:   this._toInputDate(def),
      });
    }
    if (activity) {
      this.form.patchValue({
        title:     activity.title,
        type:      activity.type,
        status:    activity.status,
        priority:  activity.priority,
        dueDate:   this._toInputDate(activity.dueDate),
        notes:     activity.notes ?? '',
      });
      this.assignees.set([...activity.assignees]);

      const dh = activity.dueDate.getHours();
      this.dueHour.set(dh % 12 || 12);
      this.dueMinute.set(activity.dueDate.getMinutes());
      this.duePeriod.set(dh < 12 ? 'AM' : 'PM');
    }
  }

  protected addChecklistItem(): void {
    this.checklistArray.push(this.fb.control('', Validators.required));
  }

  protected removeChecklistItem(index: number): void {
    this.checklistArray.removeAt(index);
  }

  protected addAssignee(): void {
    const email = this.form.value.assigneeEmail?.trim();
    if (!email || this.form.get('assigneeEmail')?.invalid) return;

    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    this.assignees.update(list => [...list, { id: crypto.randomUUID(), name, email }]);
    this.form.patchValue({ assigneeEmail: '' });
    this.showAssigneeForm.set(false);
  }

  protected removeAssignee(id: string): void {
    this.assignees.update(list => list.filter(a => a.id !== id));
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const performedBy = this.auth.user()?.name ?? 'Sistema';
    const activity = this.activity();

    const base = {
      title:     v.title!.trim(),
      type:      v.type as ActivityType,
      status:    v.status as ActivityStatus,
      priority:  v.priority as ActivityPriority,
      dueDate:   this._parseDatetime(v.dueDate!, this.dueHour(), this.dueMinute(), this.duePeriod()),
      notes:     v.notes?.trim() || undefined,
      assignees: this.assignees(),
    };

    if (activity) {
      this.activityService.update(activity.id, base, performedBy);
    } else {
      const checklist = (v.checklist as string[]).map(text => ({
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: new Date(),
      }));
      this.activityService.create({ ...base, checklist, attachments: [] }, performedBy);
    }

    this.saved.emit();
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  protected hasError(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!(c?.touched && c.hasError(error));
  }

  protected typeSelectedClass(type: ActivityType): string {
    const map: Record<ActivityType, string> = {
      meeting:  'bg-blue-100 text-blue-700 border-blue-400',
      task:     'bg-violet-100 text-violet-700 border-violet-400',
      reminder: 'bg-amber-100 text-amber-700 border-amber-400',
      deadline: 'bg-red-100 text-red-700 border-red-400',
      event:    'bg-emerald-100 text-emerald-700 border-emerald-400',
    };
    return map[type];
  }

  protected timeDisplay(h: number, m: number, p: 'AM' | 'PM'): string {
    return `${h}:${String(m).padStart(2, '0')} ${p}`;
  }

  protected toggleTimePicker(picker: 'start' | 'due', event: MouseEvent): void {
    event.stopPropagation();
    this.activeTimePicker.set(this.activeTimePicker() === picker ? null : picker);
  }

  protected closeTimePicker(): void {
    this.activeTimePicker.set(null);
  }

  protected clampHour(v: number): number {
    if (isNaN(v) || v < 1) return 1;
    return v > 12 ? 12 : v;
  }

  protected clampMinute(v: number): number {
    if (isNaN(v) || v < 0) return 0;
    return v > 59 ? 59 : v;
  }

  private _toInputDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private _parseDatetime(dateStr: string, h: number, m: number, p: 'AM' | 'PM'): Date {
    const [y, mo, d] = dateStr.split('-').map(Number);
    let h24 = h;
    if (p === 'AM' && h === 12) h24 = 0;
    else if (p === 'PM' && h !== 12) h24 = h + 12;
    return new Date(y, mo - 1, d, h24, m, 0);
  }
}
