import { Component, computed, inject, input, output, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Activity, ActivityPriority, ActivityStatus, ActivityType, HistoryAction } from '../../models/activity.model';
import { ActivityService } from '../../services/activity.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { FileDropzoneComponent } from '../file-dropzone/file-dropzone';
import { ActivityHistoryComponent } from '../activity-history/activity-history';

type DetailTab = 'info' | 'checklist' | 'attachments' | 'history';

@Component({
  selector: 'app-activity-detail',
  imports: [NgIcon, FileDropzoneComponent, ActivityHistoryComponent],
  templateUrl: './activity-detail.html',
})
export class ActivityDetailComponent {
  private activityService = inject(ActivityService);
  private auth = inject(AuthService);

  activity = input.required<Activity>();
  editRequested = output<Activity>();
  deleteRequested = output<Activity>();
  closed = output<void>();

  protected activeTab = signal<DetailTab>('info');
  protected newChecklistText = signal('');
  protected editingChecklistId = signal<string | null>(null);
  protected editingChecklistText = signal('');

  protected readonly tabs: { id: DetailTab; label: string; icon: string }[] = [
    { id: 'info',        label: 'Info',       icon: 'heroDocumentText' },
    { id: 'checklist',   label: 'Checklist',  icon: 'heroCheckCircle'  },
    { id: 'attachments', label: 'Adjuntos',   icon: 'heroPaperClip'    },
    { id: 'history',     label: 'Historial',  icon: 'heroClock'        },
  ];

  protected progress = computed(() =>
    this.activityService.checklistProgress(this.activity())
  );

  // ── Checklist ─────────────────────────────────────────────────────────────
  protected addChecklistItem(): void {
    const text = this.newChecklistText().trim();
    if (!text) return;
    const performer = this.auth.user()?.name ?? 'Sistema';
    this.activityService.addChecklistItem(this.activity().id, text, performer);
    this.newChecklistText.set('');
  }

  protected toggleItem(itemId: string): void {
    const performer = this.auth.user()?.name ?? 'Sistema';
    this.activityService.toggleChecklistItem(this.activity().id, itemId, performer);
  }

  protected startEdit(itemId: string, currentText: string): void {
    this.editingChecklistId.set(itemId);
    this.editingChecklistText.set(currentText);
  }

  protected confirmEdit(itemId: string): void {
    const text = this.editingChecklistText().trim();
    if (text) {
      const performer = this.auth.user()?.name ?? 'Sistema';
      this.activityService.updateChecklistItem(this.activity().id, itemId, text, performer);
    }
    this.editingChecklistId.set(null);
  }

  protected cancelEdit(): void {
    this.editingChecklistId.set(null);
  }

  protected removeChecklistItem(itemId: string): void {
    const performer = this.auth.user()?.name ?? 'Sistema';
    this.activityService.removeChecklistItem(this.activity().id, itemId, performer);
  }

  protected onChecklistKeydown(event: KeyboardEvent, itemId: string): void {
    if (event.key === 'Enter') this.confirmEdit(itemId);
    if (event.key === 'Escape') this.cancelEdit();
  }

  protected onNewItemKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.addChecklistItem();
  }

  // ── Clases visuales ───────────────────────────────────────────────────────
  protected typeBadgeClass(type: ActivityType): string {
    const map: Record<ActivityType, string> = {
      meeting:  'bg-blue-100 text-blue-700',
      task:     'bg-violet-100 text-violet-700',
      reminder: 'bg-amber-100 text-amber-700',
      deadline: 'bg-red-100 text-red-700',
      event:    'bg-emerald-100 text-emerald-700',
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

  protected statusClass(status: ActivityStatus): string {
    const map: Record<ActivityStatus, string> = {
      'pending':     'bg-gray-100 text-gray-600',
      'in-progress': 'bg-blue-100 text-blue-700',
      'completed':   'bg-emerald-100 text-emerald-700',
      'cancelled':   'bg-red-100 text-red-600',
    };
    return map[status];
  }

  protected statusLabel(status: ActivityStatus): string {
    const map: Record<ActivityStatus, string> = {
      'pending': 'Pendiente', 'in-progress': 'En progreso',
      'completed': 'Completado', 'cancelled': 'Cancelado',
    };
    return map[status];
  }

  protected priorityClass(priority: ActivityPriority): string {
    const map: Record<ActivityPriority, string> = {
      low:      'bg-gray-100 text-gray-500',
      medium:   'bg-amber-100 text-amber-700',
      high:     'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return map[priority];
  }

  protected priorityLabel(priority: ActivityPriority): string {
    const map: Record<ActivityPriority, string> = {
      low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica',
    };
    return map[priority];
  }

  protected formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  protected formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  protected isOverdue(activity: Activity): boolean {
    return new Date(activity.dueDate) < new Date() && activity.status !== 'completed';
  }
}
