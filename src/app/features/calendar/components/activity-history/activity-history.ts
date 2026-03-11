import { Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HistoryAction, HistoryEntry } from '../../models/activity.model';

@Component({
  selector: 'app-activity-history',
  imports: [NgIcon],
  templateUrl: './activity-history.html',
})
export class ActivityHistoryComponent {
  history = input.required<HistoryEntry[]>();

  protected historyIcon(action: HistoryAction): string {
    const map: Record<HistoryAction, string> = {
      created:            'heroCheckCircle',
      updated:            'heroPencil',
      status_changed:     'heroArrowPath',
      checklist_added:    'heroPlus',
      checklist_updated:  'heroPencil',
      checklist_removed:  'heroTrash',
      attachment_added:   'heroPaperClip',
      attachment_removed: 'heroTrash',
      assignee_added:     'heroUserPlus',
      assignee_removed:   'heroTrash',
      note_updated:       'heroDocumentText',
    };
    return map[action];
  }

  protected historyIconColor(action: HistoryAction): string {
    if (action === 'created') return 'text-emerald-600 bg-emerald-50';
    if (action.includes('removed')) return 'text-red-500 bg-red-50';
    if (action === 'status_changed') return 'text-blue-600 bg-blue-50';
    return 'text-gray-500 bg-gray-100';
  }

  protected formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }
}
