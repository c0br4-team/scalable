import {
  Component, computed, effect, inject, input, output, signal
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Activity, ActivityType } from '../../models/activity.model';
import { ActivityService } from '../../services/activity.service';

export type ViewMode = 'day' | 'week' | 'month' | 'year';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  activities: Activity[];
}

@Component({
  selector: 'app-calendar-grid',
  imports: [NgIcon],
  templateUrl: './calendar-grid.html',
  host: { class: 'h-full flex flex-col' },
})
export class CalendarGridComponent {
  private activityService = inject(ActivityService);

  selectedDate = input<Date | null>(null);
  dateSelected = output<Date>();
  activityClicked = output<Activity>();
  createRequested = output<Date>();
  navigateTo = input<{ date: Date; seq: number } | null>(null);

  protected currentDate = signal(new Date());
  protected viewMode = signal<ViewMode>('month');
  protected popoverDay = signal<CalendarDay | null>(null);
  protected popoverPos = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  protected readonly dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  protected readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  protected readonly views: { id: ViewMode; label: string }[] = [
    { id: 'day',   label: 'Día' },
    { id: 'week',  label: 'Semana' },
    { id: 'month', label: 'Mes' },
    { id: 'year',  label: 'Año' },
  ];

  constructor() {
    effect(() => {
      const nav = this.navigateTo();
      if (nav) {
        this.currentDate.set(new Date(nav.date));
        this.viewMode.set('month');
      }
    });
  }

  protected currentLabel = computed(() => {
    const d = this.currentDate();
    const mode = this.viewMode();
    if (mode === 'month') {
      return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }
    if (mode === 'year') {
      return String(d.getFullYear());
    }
    if (mode === 'day') {
      return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    // week
    const dayOfWeek = d.getDay();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    if (sunday.getMonth() === saturday.getMonth()) {
      return `${sunday.getDate()} – ${saturday.getDate()} de ${sunday.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
    }
    return `${sunday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${saturday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  });

  // ── Month view ──────────────────────────────────────────────────────────────

  protected calendarDays = computed((): CalendarDay[] => {
    const current = this.currentDate();
    const selected = this.selectedDate();
    const byDate = this.activityService.activitiesByDate();
    const year = current.getFullYear();
    const month = current.getMonth();
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(this._buildDay(new Date(year, month, -firstDay.getDay() + i + 1), false, today, selected, byDate));
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(this._buildDay(new Date(year, month, d), true, today, selected, byDate));
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(this._buildDay(new Date(year, month + 1, i), false, today, selected, byDate));
    }
    return days;
  });

  // ── Week view ───────────────────────────────────────────────────────────────

  protected weekCalendarDays = computed((): CalendarDay[] => {
    const d = this.currentDate();
    const byDate = this.activityService.activitiesByDate();
    const today = new Date();
    const selected = this.selectedDate();
    const dayOfWeek = d.getDay();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      return this._buildDay(date, true, today, selected, byDate);
    });
  });

  // ── Day view ────────────────────────────────────────────────────────────────

  protected dayActivities = computed((): Activity[] => {
    const key = this._toKey(this.currentDate());
    return this.activityService.activitiesByDate().get(key) ?? [];
  });

  protected isDayToday = computed(() => {
    const today = new Date();
    return this._toKey(this.currentDate()) === this._toKey(today);
  });

  // ── Year view ───────────────────────────────────────────────────────────────

  protected yearMonths = computed(() => {
    const year = this.currentDate().getFullYear();
    const byDate = this.activityService.activitiesByDate();
    const today = new Date();
    return Array.from({ length: 12 }, (_, month) => {
      const lastDay = new Date(year, month + 1, 0);
      let count = 0;
      for (let d = 1; d <= lastDay.getDate(); d++) {
        count += (byDate.get(this._toKey(new Date(year, month, d))) ?? []).length;
      }
      return {
        month, year, count,
        label: this.monthNames[month],
        isCurrentMonth: today.getMonth() === month && today.getFullYear() === year,
      };
    });
  });

  // ── Event handlers ──────────────────────────────────────────────────────────


  protected setView(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.popoverDay.set(null);
  }

  protected prev(): void {
    const mode = this.viewMode();
    this.currentDate.update(d => {
      const n = new Date(d);
      if (mode === 'day')        n.setDate(d.getDate() - 1);
      else if (mode === 'week')  n.setDate(d.getDate() - 7);
      else if (mode === 'month') n.setMonth(d.getMonth() - 1, 1);
      else                       n.setFullYear(d.getFullYear() - 1);
      return n;
    });
  }

  protected next(): void {
    const mode = this.viewMode();
    this.currentDate.update(d => {
      const n = new Date(d);
      if (mode === 'day')        n.setDate(d.getDate() + 1);
      else if (mode === 'week')  n.setDate(d.getDate() + 7);
      else if (mode === 'month') n.setMonth(d.getMonth() + 1, 1);
      else                       n.setFullYear(d.getFullYear() + 1);
      return n;
    });
  }

  protected goToToday(): void {
    this.currentDate.set(new Date());
    this.dateSelected.emit(new Date());
  }

  protected selectDay(day: CalendarDay): void {
    this.dateSelected.emit(day.date);
  }

  protected onDayClick(day: CalendarDay): void {
    this.dateSelected.emit(day.date);
    this.createRequested.emit(day.date);
  }

  protected goToMonthView(month: number): void {
    this.currentDate.update(d => new Date(d.getFullYear(), month, 1));
    this.viewMode.set('month');
  }

  protected goToDayView(day: CalendarDay): void {
    this.currentDate.set(new Date(day.date));
    this.viewMode.set('day');
    this.dateSelected.emit(day.date);
  }

  protected onActivityClick(event: MouseEvent, activity: Activity): void {
    event.stopPropagation();
    this.popoverDay.set(null);
    this.activityClicked.emit(activity);
  }

  protected showMorePopover(event: MouseEvent, day: CalendarDay): void {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const popoverWidth = 220;
    const left = Math.min(rect.left, window.innerWidth - popoverWidth - 8);
    this.popoverPos.set({ top: rect.bottom + 4, left });
    this.popoverDay.set(day);
  }

  protected closePopover(event: MouseEvent): void {
    event.stopPropagation();
    this.popoverDay.set(null);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  protected typeColor(type: ActivityType): string {
    const map: Record<ActivityType, string> = {
      meeting:  'bg-blue-100 text-blue-700 border-blue-200',
      task:     'bg-violet-100 text-violet-700 border-violet-200',
      reminder: 'bg-amber-100 text-amber-700 border-amber-200',
      deadline: 'bg-red-100 text-red-700 border-red-200',
      event:    'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return map[type];
  }

  protected typeDot(type: ActivityType): string {
    const map: Record<ActivityType, string> = {
      meeting:  'bg-blue-500',
      task:     'bg-violet-500',
      reminder: 'bg-amber-500',
      deadline: 'bg-red-500',
      event:    'bg-emerald-500',
    };
    return map[type];
  }

  protected monthCardClass(m: { isCurrentMonth: boolean }): string {
    return m.isCurrentMonth
      ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white'
      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50';
  }

  protected monthBadgeClass(m: { isCurrentMonth: boolean }): string {
    return m.isCurrentMonth
      ? 'bg-white text-[#1e3a5f]'
      : 'bg-blue-100 text-blue-700';
  }

  protected typeLabel(type: ActivityType): string {
    const map: Record<ActivityType, string> = {
      meeting: 'Reunión', task: 'Tarea', reminder: 'Recordatorio',
      deadline: 'Fecha límite', event: 'Evento',
    };
    return map[type];
  }

  protected formatDueDate(activity: Activity): string {
    return activity.dueDate.toLocaleString('es-ES', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  protected dueText(activity: Activity): string {
    if (activity.status === 'completed') return '✓ Completada';
    if (activity.status === 'cancelled') return '✕ Cancelada';
    const diff = activity.dueDate.getTime() - Date.now();
    const abs = Math.abs(diff);
    const days  = Math.floor(abs / 86400000);
    const hours = Math.floor((abs % 86400000) / 3600000);
    const mins  = Math.floor((abs % 3600000) / 60000);
    if (diff < 0) {
      if (days  > 0) return `Vencida hace ${days}d`;
      if (hours > 0) return `Vencida hace ${hours}h`;
      return `Vencida hace ${mins}min`;
    }
    if (days  > 0) return `Vence en ${days}d`;
    if (hours > 0) return `Vence en ${hours}h`;
    return `Vence en ${mins}min`;
  }

  protected dueBadgeClass(activity: Activity): string {
    if (activity.status === 'completed') return 'bg-green-100 text-green-700';
    if (activity.status === 'cancelled') return 'bg-gray-200 text-gray-500';
    const overdue = activity.dueDate.getTime() < Date.now();
    return overdue ? 'bg-red-500 text-white' : 'bg-green-100 text-green-700';
  }

  protected assigneeNames(activity: Activity): string {
    if (!activity.assignees.length) return '';
    const names = activity.assignees.slice(0, 2).map(a => a.name).join(', ');
    const extra = activity.assignees.length > 2 ? ` +${activity.assignees.length - 2}` : '';
    return names + extra;
  }

  private _toKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private _buildDay(
    date: Date, isCurrentMonth: boolean, today: Date,
    selected: Date | null, byDate: Map<string, Activity[]>
  ): CalendarDay {
    const key = this._toKey(date);
    return {
      date, isCurrentMonth,
      isToday: this._toKey(date) === this._toKey(today),
      isSelected: selected ? this._toKey(date) === this._toKey(selected) : false,
      activities: byDate.get(key) ?? [],
    };
  }
}
