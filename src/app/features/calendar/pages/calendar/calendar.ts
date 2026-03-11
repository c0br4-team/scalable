import { Component, computed, inject, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Activity } from '../../models/activity.model';
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

  protected selectedDate = signal<Date | null>(new Date());
  protected showModal = signal(false);
  protected editingActivity = signal<Activity | null>(null);
  protected showDeleteConfirm = signal(false);
  protected deletingActivity = signal<Activity | null>(null);

  protected selectedActivity = this.activityService.selectedActivity;

  protected activitiesForSelectedDate = computed(() => {
    const date = this.selectedDate();
    return date ? this.activityService.getActivitiesForDate(date) : [];
  });

  protected openCreate(): void {
    this.editingActivity.set(null);
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
  }

  protected onModalCancelled(): void {
    this.showModal.set(false);
    this.editingActivity.set(null);
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
}
