import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Activity, ActivityFilters, ActivityStatus, ActivityType } from '../../models/activity.model';
import { ActivityService } from '../../services/activity.service';
import { CalendarGridComponent } from '../../components/calendar-grid/calendar-grid';
import { ActivityModalComponent } from '../../components/activity-modal/activity-modal';
import { ActivityDetailComponent } from '../../components/activity-detail/activity-detail';

@Component({
  selector: 'app-calendar',
  imports: [NgIcon, CalendarGridComponent, ActivityModalComponent, ActivityDetailComponent],
  templateUrl: './calendar.html',
  host: { class: 'flex flex-col flex-1 overflow-hidden' },
})
export class CalendarPage {
  protected activityService = inject(ActivityService);

  protected selectedDate      = signal<Date | null>(new Date());
  protected showModal         = signal(false);
  protected editingActivity   = signal<Activity | null>(null);
  protected editingDate       = signal<Date | null>(null);
  protected showDeleteConfirm = signal(false);
  protected deletingActivity  = signal<Activity | null>(null);
  protected showFilters       = signal(false);

  // ── Filter state ────────────────────────────────────────────────────────────
  protected filterSearch        = signal('');
  protected filterTypes         = signal<ActivityType[]>([]);
  protected filterStatuses      = signal<ActivityStatus[]>([]);
  protected filterAssigneeEmail = signal('');
  protected filterOverdue       = signal(false);
  protected filterUpcoming      = signal(false);
  protected filterDueDateFrom   = signal('');
  protected filterDueDateTo     = signal('');
  protected filterCreatedFrom   = signal('');
  protected filterCreatedTo     = signal('');

  // Navigate calendar grid externally
  protected navigateToDate = signal<{ date: Date; seq: number } | null>(null);
  private _navSeq = 0;

  protected selectedActivity = this.activityService.selectedActivity;
  protected filterResults    = computed(() => this.activityService.filteredActivities());

  protected activeFiltersCount = computed(() => {
    let n = 0;
    if (this.filterSearch()) n++;
    if (this.filterTypes().length) n++;
    if (this.filterStatuses().length) n++;
    if (this.filterAssigneeEmail()) n++;
    if (this.filterOverdue() || this.filterUpcoming()) n++;
    if (this.filterDueDateFrom() || this.filterDueDateTo()) n++;
    if (this.filterCreatedFrom() || this.filterCreatedTo()) n++;
    return n;
  });

  protected hasActiveFilters = computed(() => this.activeFiltersCount() > 0);

  protected activitiesForSelectedDate = computed(() => {
    const date = this.selectedDate();
    return date ? this.activityService.getActivitiesForDate(date) : [];
  });

  protected readonly typeOptions: { value: ActivityType; label: string; activeClass: string }[] = [
    { value: 'meeting',  label: 'Reunión',       activeClass: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'task',     label: 'Tarea',          activeClass: 'bg-violet-100 text-violet-700 border-violet-300' },
    { value: 'reminder', label: 'Recordatorio',   activeClass: 'bg-amber-100 text-amber-700 border-amber-300' },
    { value: 'deadline', label: 'Fecha límite',   activeClass: 'bg-red-100 text-red-700 border-red-300' },
    { value: 'event',    label: 'Evento',          activeClass: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  ];

  protected readonly statusOptions: { value: ActivityStatus; label: string; activeClass: string }[] = [
    { value: 'pending',     label: 'Pendiente',   activeClass: 'bg-gray-200 text-gray-700 border-gray-400' },
    { value: 'in-progress', label: 'En progreso', activeClass: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'completed',   label: 'Completado',  activeClass: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'cancelled',   label: 'Cancelado',   activeClass: 'bg-red-100 text-red-700 border-red-300' },
  ];

  private readonly _typeBadge: Record<ActivityType, string> = {
    meeting:  'bg-blue-100 text-blue-700',
    task:     'bg-violet-100 text-violet-700',
    reminder: 'bg-amber-100 text-amber-700',
    deadline: 'bg-red-100 text-red-700',
    event:    'bg-emerald-100 text-emerald-700',
  };

  private readonly _typeLabels: Record<ActivityType, string> = {
    meeting: 'Reunión', task: 'Tarea', reminder: 'Recordatorio', deadline: 'Fecha límite', event: 'Evento',
  };

  private readonly _statusLabels: Record<ActivityStatus, string> = {
    pending: 'Pendiente', 'in-progress': 'En progreso', completed: 'Completado', cancelled: 'Cancelado',
  };

  constructor() {
    effect(() => {
      const f: ActivityFilters = {};
      const search = this.filterSearch();
      if (search) f.searchTitle = search;
      const types = this.filterTypes();
      if (types.length) f.types = types;
      const statuses = this.filterStatuses();
      if (statuses.length) f.statuses = statuses;
      const email = this.filterAssigneeEmail();
      if (email) f.assigneeEmail = email;
      if (this.filterOverdue()) f.overdue = true;
      if (this.filterUpcoming()) f.upcoming = true;
      const dfrom = this.filterDueDateFrom();
      const dto   = this.filterDueDateTo();
      if (dfrom || dto) {
        f.dueDateRange = {
          from: dfrom ? new Date(dfrom) : new Date(0),
          to:   dto   ? new Date(dto + 'T23:59:59') : new Date(8640000000000000),
        };
      }
      const cfrom = this.filterCreatedFrom();
      const cto   = this.filterCreatedTo();
      if (cfrom || cto) {
        f.createdDateRange = {
          from: cfrom ? new Date(cfrom) : new Date(0),
          to:   cto   ? new Date(cto + 'T23:59:59') : new Date(8640000000000000),
        };
      }
      this.activityService.setFilters(f);
    });
  }

  // ── Calendar events ──────────────────────────────────────────────────────────

  protected openCreate(): void {
    this.editingActivity.set(null);
    this.editingDate.set(null);
    this.showModal.set(true);
  }

  protected onCreateRequested(date: Date): void {
    this.editingActivity.set(null);
    this.editingDate.set(date);
    this.showModal.set(true);
  }

  protected onDateSelected(date: Date): void {
    this.selectedDate.set(date);
    this.activityService.select(null);
  }

  protected onActivityClicked(activity: Activity): void {
    this.activityService.select(activity.id);
  }

  protected onModalSaved(): void {
    this.showModal.set(false);
    this.editingActivity.set(null);
    this.editingDate.set(null);
  }

  protected onModalCancelled(): void {
    this.showModal.set(false);
    this.editingActivity.set(null);
    this.editingDate.set(null);
  }

  protected onEditRequested(activity: Activity): void {
    this.editingActivity.set(activity);
    this.showModal.set(true);
  }

  protected onDeleteRequested(activity: Activity): void {
    this.deletingActivity.set(activity);
    this.showDeleteConfirm.set(true);
  }

  protected confirmDelete(): void {
    const a = this.deletingActivity();
    if (a) this.activityService.delete(a.id);
    this.showDeleteConfirm.set(false);
    this.deletingActivity.set(null);
  }

  protected cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deletingActivity.set(null);
  }

  protected closeDetail(): void {
    this.activityService.select(null);
  }

  // ── Filter actions ───────────────────────────────────────────────────────────

  protected toggleType(type: ActivityType): void {
    this.filterTypes.update(arr =>
      arr.includes(type) ? arr.filter(t => t !== type) : [...arr, type]
    );
  }

  protected toggleStatus(status: ActivityStatus): void {
    this.filterStatuses.update(arr =>
      arr.includes(status) ? arr.filter(s => s !== status) : [...arr, status]
    );
  }

  protected clearFilters(): void {
    this.filterSearch.set('');
    this.filterTypes.set([]);
    this.filterStatuses.set([]);
    this.filterAssigneeEmail.set('');
    this.filterOverdue.set(false);
    this.filterUpcoming.set(false);
    this.filterDueDateFrom.set('');
    this.filterDueDateTo.set('');
    this.filterCreatedFrom.set('');
    this.filterCreatedTo.set('');
  }

  protected goToActivity(activity: Activity): void {
    this.navigateToDate.set({ date: new Date(activity.dueDate), seq: ++this._navSeq });
    this.activityService.select(activity.id);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  protected typeBadge(type: ActivityType): string  { return this._typeBadge[type]; }
  protected typeLabel(type: ActivityType): string   { return this._typeLabels[type]; }
  protected statusLabel(s: ActivityStatus): string  { return this._statusLabels[s]; }

  protected formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
