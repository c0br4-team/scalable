import { Component, Input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { CaseComment } from '../../../models/case.model';

@Component({
  selector: 'app-case-comments-tab',
  templateUrl: './comments-tab.html',
  standalone: true,
  imports: [NgIcon],
})
export class CaseCommentsTabComponent {
  @Input() comments: CaseComment[] = [];

  protected newComment = signal('');

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  protected addComment(): void {
    if (!this.newComment().trim()) return;
    // In real app: call service. For mock, just clear.
    this.newComment.set('');
  }

  protected initials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }
}
