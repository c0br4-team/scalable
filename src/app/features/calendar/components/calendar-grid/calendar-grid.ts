import {
  Component, computed, HostListener, inject, input, output, signal
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Activity, ActivityType } from '../../models/activity.model';
import { ActivityService } from '../../services/activity.service';

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

  protected currentDate = signal(new Date());
  protected popoverDay = signal<CalendarDay | null>(null);
  protected popoverPos = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  protected readonly weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  protected currentMonthLabel = computed(() => {
    const d = this.currentDate();
    return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  });

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
      const date = new Date(year, month, -firstDay.getDay() + i + 1);
      days.push(this._buildDay(date, false, today, selected, byDate));
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

  @HostListener('document:click')
  protected onDocumentClick(): void {
    this.popoverDay.set(null);
  }

  protected prevMonth(): void {
    this.currentDate.update(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    this.currentDate.update(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  protected goToToday(): void {
    this.currentDate.set(new Date());
    this.dateSelected.emit(new Date());
  }

  protected selectDay(day: CalendarDay): void {
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

  protected typeLabel(type: ActivityType): string {
    const map: Record<ActivityType, string> = {
      meeting: 'Reunión', task: 'Tarea', reminder: 'Recordatorio',
      deadline: 'Fecha límite', event: 'Evento',
    };
    return map[type];
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
