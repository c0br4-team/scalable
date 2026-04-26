import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Case, CasePriority, CaseStatus, CaseTab, CaseType } from '../../models/case.model';
import { CaseDescriptionTabComponent } from '../../components/tabs/description-tab/description-tab';
import { CaseDocumentsTabComponent } from '../../components/tabs/documents-tab/documents-tab';
import { CaseCommentsTabComponent } from '../../components/tabs/comments-tab/comments-tab';
import { CaseNotesTabComponent } from '../../components/tabs/notes-tab/notes-tab';
import { CaseHistoryTabComponent } from '../../components/tabs/history-tab/history-tab';
import { CaseService } from '../../../../core/http/services/case.service';

@Component({
  selector: 'app-case-detail',
  templateUrl: './case-detail.html',
  host: { class: 'flex flex-col flex-1 overflow-hidden' },
  imports: [
    NgIcon,
    CaseDescriptionTabComponent,
    CaseDocumentsTabComponent,
    CaseCommentsTabComponent,
    CaseNotesTabComponent,
    CaseHistoryTabComponent,
  ],
})
export class CaseDetailPage implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private caseService = inject(CaseService);

  protected case_         = signal<Case | null>(null);
  protected loading       = signal(true);
  protected activeTab     = signal<CaseTab>('description');
  protected showCaseHeader = signal(true);

  protected readonly tabs: { key: CaseTab; label: string; icon: string }[] = [
    { key: 'description', label: 'Descripción',    icon: 'heroDocumentText' },
    { key: 'documents',   label: 'Documentos',     icon: 'heroDocument' },
    { key: 'comments',    label: 'Comentarios',    icon: 'heroChatBubbleLeftEllipsis' },
    { key: 'notes',       label: 'Notas',          icon: 'heroPencil' },
    { key: 'history',     label: 'Historial',      icon: 'heroClock' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.caseService.getById(id).subscribe({
      next: (c) => { this.case_.set(c); this.loading.set(false); },
      error: () => this.router.navigate(['/cases']),
    });
  }

  protected goBack(): void {
    this.router.navigate(['/cases']);
  }

  // ── Helpers ───────────────────────────────────────────────────
  protected statusCls(s: CaseStatus): string {
    return { active: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', closed: 'bg-gray-200 text-gray-500', suspended: 'bg-red-100 text-red-700' }[s];
  }
  protected statusLabel(s: CaseStatus): string {
    return { active: 'Activo', pending: 'Pendiente', closed: 'Cerrado', suspended: 'Suspendido' }[s];
  }
  protected priorityCls(p: CasePriority): string {
    return { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-amber-100 text-amber-700', critical: 'bg-red-100 text-red-700' }[p];
  }
  protected priorityLabel(p: CasePriority): string {
    return { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' }[p];
  }
  protected typeCls(t: CaseType): string {
    return { civil: 'bg-blue-100 text-blue-700', contratos: 'bg-violet-100 text-violet-700', laboral: 'bg-orange-100 text-orange-700', societario: 'bg-teal-100 text-teal-700' }[t];
  }
  protected typeLabel(t: CaseType): string {
    return { civil: 'Civil', contratos: 'Contratos', laboral: 'Laboral', societario: 'Societario' }[t];
  }
  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
