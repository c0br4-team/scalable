import { Injectable, computed, signal } from '@angular/core';
import {
  Activity, ActivityFilters, ActivityPriority, ActivityStatus, ActivityType,
  Assignee, Attachment, ChecklistItem, HistoryEntry
} from '../models/activity.model';

@Injectable({ providedIn: 'root' })
export class ActivityService {

  // ── Estado ──────────────────────────────────────────────────────────────────
  private _activities = signal<Activity[]>(this._loadFromStorage());
  private _filters = signal<ActivityFilters>({});
  private _selectedId = signal<string | null>(null);

  // ── Computed públicos ────────────────────────────────────────────────────────
  readonly activities = this._activities.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly selectedId = this._selectedId.asReadonly();

  readonly filteredActivities = computed(() => {
    const all = this._activities();
    const f = this._filters();
    const now = Date.now();

    return all.filter(a => {
      if (f.types?.length && !f.types.includes(a.type)) return false;
      if (f.statuses?.length && !f.statuses.includes(a.status)) return false;
      if (f.priorities?.length && !f.priorities.includes(a.priority)) return false;
      if (f.assigneeId && !a.assignees.some(x => x.id === f.assigneeId)) return false;
      if (f.assigneeEmail) {
        const q = f.assigneeEmail.toLowerCase();
        if (!a.assignees.some(x => x.email.toLowerCase().includes(q) || x.name.toLowerCase().includes(q))) return false;
      }
      if (f.dueDateRange) {
        const due = new Date(a.dueDate);
        if (due < f.dueDateRange.from || due > f.dueDateRange.to) return false;
      }
      if (f.createdDateRange) {
        const created = new Date(a.createdAt);
        if (created < f.createdDateRange.from || created > f.createdDateRange.to) return false;
      }
      if (f.overdue && new Date(a.dueDate).getTime() >= now) return false;
      if (f.upcoming) {
        const due = new Date(a.dueDate).getTime();
        if (due < now || due > now + 7 * 24 * 60 * 60 * 1000) return false;
      }
      if (f.searchTitle && !a.title.toLowerCase().includes(f.searchTitle.toLowerCase())) return false;
      return true;
    });
  });

  readonly selectedActivity = computed(() => {
    const id = this._selectedId();
    return id ? this._activities().find(a => a.id === id) ?? null : null;
  });

  /** Actividades agrupadas por fecha (YYYY-MM-DD) para el calendario */
  readonly activitiesByDate = computed(() => {
    const map = new Map<string, Activity[]>();
    for (const activity of this.filteredActivities()) {
      const key = this._toDateKey(new Date(activity.dueDate));
      const list = map.get(key) ?? [];
      list.push(activity);
      map.set(key, list);
    }
    return map;
  });

  // ── Selección ────────────────────────────────────────────────────────────────
  select(id: string | null): void {
    this._selectedId.set(id);
  }

  // ── Filtros ──────────────────────────────────────────────────────────────────
  setFilters(filters: ActivityFilters): void {
    this._filters.set(filters);
  }

  clearFilters(): void {
    this._filters.set({});
  }

  // ── CRUD principal ───────────────────────────────────────────────────────────
  create(data: Omit<Activity, 'id' | 'history' | 'createdAt' | 'updatedAt'>, performedBy: string): Activity {
    const now = new Date();
    const activity: Activity = {
      ...data,
      id: this._uuid(),
      history: [],
      createdAt: now,
      updatedAt: now,
    };

    activity.history.push(this._historyEntry('created', `Actividad creada por ${performedBy}`, performedBy));

    this._activities.update(list => [...list, activity]);
    this._persist();
    return activity;
  }

  update(id: string, changes: Partial<Omit<Activity, 'id' | 'history' | 'createdAt'>>, performedBy: string): void {
    this._activities.update(list =>
      list.map(a => {
        if (a.id !== id) return a;

        const descriptions: string[] = [];
        if (changes.title && changes.title !== a.title) descriptions.push(`Título cambiado a "${changes.title}"`);
        if (changes.status && changes.status !== a.status) descriptions.push(`Estado: ${a.status} → ${changes.status}`);
        if (changes.priority && changes.priority !== a.priority) descriptions.push(`Prioridad: ${a.priority} → ${changes.priority}`);
        if (changes.dueDate && new Date(changes.dueDate).toDateString() !== new Date(a.dueDate).toDateString())
          descriptions.push(`Vencimiento actualizado`);
        if (changes.notes !== undefined && changes.notes !== a.notes) descriptions.push(`Notas actualizadas`);

        const action = changes.status && changes.status !== a.status ? 'status_changed' : 'updated';
        const description = descriptions.length ? descriptions.join(', ') : 'Actividad actualizada';

        return {
          ...a,
          ...changes,
          updatedAt: new Date(),
          history: [...a.history, this._historyEntry(action, description, performedBy, changes as Record<string, unknown>)],
        };
      })
    );
    this._persist();
  }

  delete(id: string): void {
    this._activities.update(list => list.filter(a => a.id !== id));
    if (this._selectedId() === id) this._selectedId.set(null);
    this._persist();
  }

  // ── Checklist ────────────────────────────────────────────────────────────────
  addChecklistItem(activityId: string, text: string, performedBy: string): void {
    const item: ChecklistItem = {
      id: this._uuid(),
      text,
      completed: false,
      createdAt: new Date(),
    };
    this._patchActivity(activityId, a => ({
      checklist: [...a.checklist, item],
      history: [...a.history, this._historyEntry('checklist_added', `Ítem agregado: "${text}"`, performedBy)],
    }));
  }

  toggleChecklistItem(activityId: string, itemId: string, performedBy: string): void {
    this._patchActivity(activityId, a => {
      const item = a.checklist.find(c => c.id === itemId);
      if (!item) return {};
      const completed = !item.completed;
      return {
        checklist: a.checklist.map(c =>
          c.id === itemId ? { ...c, completed, completedAt: completed ? new Date() : undefined } : c
        ),
        history: [...a.history, this._historyEntry(
          'checklist_updated',
          `"${item.text}" marcado como ${completed ? 'completado' : 'pendiente'}`,
          performedBy
        )],
      };
    });
  }

  updateChecklistItem(activityId: string, itemId: string, text: string, performedBy: string): void {
    this._patchActivity(activityId, a => ({
      checklist: a.checklist.map(c => c.id === itemId ? { ...c, text } : c),
      history: [...a.history, this._historyEntry('checklist_updated', `Ítem actualizado: "${text}"`, performedBy)],
    }));
  }

  removeChecklistItem(activityId: string, itemId: string, performedBy: string): void {
    this._patchActivity(activityId, a => {
      const item = a.checklist.find(c => c.id === itemId);
      return {
        checklist: a.checklist.filter(c => c.id !== itemId),
        history: [...a.history, this._historyEntry('checklist_removed', `Ítem eliminado: "${item?.text}"`, performedBy)],
      };
    });
  }

  // ── Adjuntos ─────────────────────────────────────────────────────────────────
  addAttachment(activityId: string, attachment: Omit<Attachment, 'id' | 'uploadedAt'>, performedBy: string): void {
    const full: Attachment = {
      ...attachment,
      id: this._uuid(),
      uploadedAt: new Date(),
    };
    this._patchActivity(activityId, a => ({
      attachments: [...a.attachments, full],
      history: [...a.history, this._historyEntry('attachment_added', `Archivo adjunto: "${attachment.name}"`, performedBy)],
    }));
  }

  removeAttachment(activityId: string, attachmentId: string, performedBy: string): void {
    this._patchActivity(activityId, a => {
      const file = a.attachments.find(f => f.id === attachmentId);
      URL.revokeObjectURL(file?.url ?? '');
      return {
        attachments: a.attachments.filter(f => f.id !== attachmentId),
        history: [...a.history, this._historyEntry('attachment_removed', `Archivo eliminado: "${file?.name}"`, performedBy)],
      };
    });
  }

  // ── Responsables ─────────────────────────────────────────────────────────────
  addAssignee(activityId: string, assignee: Assignee, performedBy: string): void {
    this._patchActivity(activityId, a => ({
      assignees: [...a.assignees, assignee],
      history: [...a.history, this._historyEntry('assignee_added', `Responsable agregado: ${assignee.name}`, performedBy)],
    }));
  }

  removeAssignee(activityId: string, assigneeId: string, performedBy: string): void {
    this._patchActivity(activityId, a => {
      const person = a.assignees.find(x => x.id === assigneeId);
      return {
        assignees: a.assignees.filter(x => x.id !== assigneeId),
        history: [...a.history, this._historyEntry('assignee_removed', `Responsable removido: ${person?.name}`, performedBy)],
      };
    });
  }

  // ── Utilidades públicas ───────────────────────────────────────────────────────
  getActivitiesForDate(date: Date): Activity[] {
    return this.activitiesByDate().get(this._toDateKey(date)) ?? [];
  }

  checklistProgress(activity: Activity): { done: number; total: number; percent: number } {
    const total = activity.checklist.length;
    const done = activity.checklist.filter(c => c.completed).length;
    return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
  }

  // ── Privados ─────────────────────────────────────────────────────────────────
  private _patchActivity(id: string, patch: (a: Activity) => Partial<Activity>): void {
    this._activities.update(list =>
      list.map(a => a.id === id ? { ...a, ...patch(a), updatedAt: new Date() } : a)
    );
    this._persist();
  }

  private _historyEntry(
    action: HistoryEntry['action'],
    description: string,
    performedBy: string,
    metadata?: Record<string, unknown>
  ): HistoryEntry {
    return { id: this._uuid(), action, description, performedBy, performedAt: new Date(), metadata };
  }

  private _toDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private _uuid(): string {
    return crypto.randomUUID();
  }

  private _persist(): void {
    try {
      const serialized = JSON.stringify(this._activities());
      localStorage.setItem('calendar_activities', serialized);
    } catch { /* cuota excedida — ignorar */ }
  }

  private _loadFromStorage(): Activity[] {
    try {
      const raw = localStorage.getItem('calendar_activities');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Activity[];
      // Rehidratar fechas (JSON.parse las convierte a string)
      return parsed.map(a => ({
        ...a,
        dueDate: new Date(a.dueDate),
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
        checklist: a.checklist.map(c => ({
          ...c,
          createdAt: new Date(c.createdAt),
          completedAt: c.completedAt ? new Date(c.completedAt) : undefined,
        })),
        attachments: a.attachments.map(f => ({
          ...f,
          uploadedAt: new Date(f.uploadedAt),
        })),
        history: a.history.map(h => ({
          ...h,
          performedAt: new Date(h.performedAt),
        })),
      }));
    } catch { return []; }
  }
}
