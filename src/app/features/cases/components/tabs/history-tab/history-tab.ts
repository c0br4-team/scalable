import { Component, Input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { CaseHistoryEntry } from '../../../models/case.model';

@Component({
  selector: 'app-case-history-tab',
  templateUrl: './history-tab.html',
  standalone: true,
  imports: [NgIcon],
})
export class CaseHistoryTabComponent {
  @Input() history: CaseHistoryEntry[] = [];

  protected iconForAction(action: string): string {
    if (action === 'created') return 'heroPlus';
    if (action === 'status_changed') return 'heroArrowPath';
    if (action === 'document_added') return 'heroDocument';
    if (action === 'comment_added') return 'heroChatBubbleLeftEllipsis';
    if (action === 'note_added') return 'heroPencil';
    if (action === 'assignee_changed') return 'heroUserCircle';
    if (action === 'closed') return 'heroCheckCircle';
    return 'heroClock';
  }

  protected clsForAction(action: string): string {
    if (action === 'created') return 'bg-green-100 text-green-600';
    if (action === 'closed') return 'bg-gray-200 text-gray-500';
    if (action === 'status_changed') return 'bg-blue-100 text-blue-600';
    return 'bg-gray-100 text-gray-500';
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
}
