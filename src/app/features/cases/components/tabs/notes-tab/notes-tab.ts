import { Component, Input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { CaseNote } from '../../../models/case.model';

@Component({
  selector: 'app-case-notes-tab',
  templateUrl: './notes-tab.html',
  standalone: true,
  imports: [NgIcon],
})
export class CaseNotesTabComponent {
  @Input() notes: CaseNote[] = [];

  protected expandedNote = signal<string | null>(null);

  protected toggleNote(id: string): void {
    this.expandedNote.update(v => v === id ? null : id);
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
