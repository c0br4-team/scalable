import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { FormsModule } from '@angular/forms';
import { CaseDocument, CaseFolder, DocumentType } from '../../../models/case.model';
import { AuthService } from '../../../../../core/auth/services/auth.service';
import { DocumentCardComponent } from './components/document-card/document-card';
import { DocumentFolderSidebarComponent, FolderSidebarItem } from './components/document-folder-sidebar/document-folder-sidebar';
import { DocumentUploadModalComponent, UploadSubmitEvent } from './components/document-upload-modal/document-upload-modal';
import { DocumentVersionModalComponent } from './components/document-version-modal/document-version-modal';

@Component({
  selector: 'app-case-documents-tab',
  templateUrl: './documents-tab.html',
  standalone: true,
  imports: [
    NgIcon,
    FormsModule,
    DocumentCardComponent,
    DocumentFolderSidebarComponent,
    DocumentUploadModalComponent,
    DocumentVersionModalComponent,
  ],
})
export class CaseDocumentsTabComponent implements OnChanges {
  @Input() documents: CaseDocument[] = [];
  @Input() folders: CaseFolder[] = [];
  @Input() caseId = '';

  private auth = inject(AuthService);

  // ── Internal mutable state ─────────────────────────────────────
  protected internalDocs    = signal<CaseDocument[]>([]);
  protected internalFolders = signal<CaseFolder[]>([]);

  // ── UI state ───────────────────────────────────────────────────
  protected showUploadModal  = signal(false);
  protected isDragging       = signal(false);
  protected showNewFolder    = signal(false);
  protected versionTarget    = signal<CaseDocument | null>(null);
  protected expandedVersions = signal<Set<string>>(new Set());
  protected activeFolderKey  = signal<string>('__all__');

  // ── Upload pre-fill state (passed to modal) ────────────────────
  protected preselectedFolderId: string | null = null;
  protected preselectedFile: File | null = null;

  // ── New folder (top bar) ───────────────────────────────────────
  protected newFolderName = '';

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documents']?.firstChange) {
      this.internalDocs.set([...this.documents]);
    }
    if (changes['folders']?.firstChange) {
      this.internalFolders.set([...this.folders]);
    }
  }

  // ── Permissions ───────────────────────────────────────────────
  protected get canUpload(): boolean {
    const r = this.auth.user()?.role;
    return r === 'admin' || r === 'abogada';
  }
  protected get canDownload(): boolean { return true; }
  protected get canUploadVersion(): boolean {
    const r = this.auth.user()?.role;
    return r === 'admin' || r === 'abogada';
  }
  protected get canDelete(): boolean {
    return this.auth.user()?.role === 'admin';
  }

  // ── Computed views ────────────────────────────────────────────
  protected get allFolders(): CaseFolder[] {
    return this.internalFolders();
  }

  protected get sidebarItems(): FolderSidebarItem[] {
    const docs = this.internalDocs();
    const items: FolderSidebarItem[] = [
      { key: '__all__', label: 'Todos', count: docs.length },
      ...this.allFolders.map(f => ({
        key: f.id,
        label: f.name,
        count: docs.filter(d => d.folderId === f.id).length,
      })),
    ];
    const noFolderCount = docs.filter(
      d => !d.folderId || !this.allFolders.find(f => f.id === d.folderId)
    ).length;
    if (noFolderCount > 0) {
      items.push({ key: '__no_folder__', label: 'Sin carpeta', count: noFolderCount });
    }
    return items;
  }

  protected get hasSidebar(): boolean {
    return this.allFolders.length > 0;
  }

  protected get visibleDocs(): CaseDocument[] {
    const key = this.activeFolderKey();
    const docs = this.internalDocs();
    if (key === '__all__') return docs;
    if (key === '__no_folder__') {
      return docs.filter(d => !d.folderId || !this.allFolders.find(f => f.id === d.folderId));
    }
    return docs.filter(d => d.folderId === key);
  }

  protected get activeFolderLabel(): string {
    const key = this.activeFolderKey();
    if (key === '__all__') return 'Todos los documentos';
    if (key === '__no_folder__') return 'Sin carpeta';
    return this.allFolders.find(f => f.id === key)?.name ?? '';
  }

  protected docFolderName(doc: CaseDocument): string | null {
    if (!doc.folderId) return null;
    return this.allFolders.find(f => f.id === doc.folderId)?.name ?? null;
  }

  protected isVersionExpanded(docId: string): boolean {
    return this.expandedVersions().has(docId);
  }

  protected toggleVersionExpand(docId: string): void {
    this.expandedVersions.update(s => {
      const n = new Set(s);
      n.has(docId) ? n.delete(docId) : n.add(docId);
      return n;
    });
  }

  // ── Drag & drop (main area) ───────────────────────────────────
  protected onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(e: DragEvent): void {
    if (!(e.currentTarget as Element).contains(e.relatedTarget as Node)) {
      this.isDragging.set(false);
    }
  }

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.openUploadWithFile(file);
  }

  // ── Upload ────────────────────────────────────────────────────
  protected openUpload(): void {
    const key = this.activeFolderKey();
    this.preselectedFolderId = (key === '__all__' || key === '__no_folder__') ? '' : key;
    this.preselectedFile = null;
    this.showUploadModal.set(true);
  }

  protected openUploadWithFile(file: File): void {
    const key = this.activeFolderKey();
    this.preselectedFolderId = (key === '__all__' || key === '__no_folder__') ? '' : key;
    this.preselectedFile = file;
    this.showUploadModal.set(true);
  }

  protected onUploadSubmitted(event: UploadSubmitEvent): void {
    const now = new Date().toISOString();
    const uploader = this.auth.user()?.name ?? 'Usuario';
    const sizeKb = Math.round(event.file.size / 1024) || 1;
    const ext = event.file.name.split('.').pop()?.toLowerCase() ?? 'other';

    const newDoc: CaseDocument = {
      id: `doc-mock-${Date.now()}`,
      name: event.name,
      originalFileName: event.file.name,
      documentType: event.docType,
      folderId: event.folderId,
      fileType: ext,
      sizeKb,
      uploadedBy: uploader,
      uploadedAt: now,
      currentVersion: 1,
      versions: [{ versionNumber: 1, sizeKb, uploadedBy: uploader, uploadedAt: now }],
    };

    this.internalDocs.update(docs => [...docs, newDoc]);
    if (event.folderId) this.activeFolderKey.set(event.folderId);
    this.showUploadModal.set(false);
  }

  protected onFolderCreated(folder: CaseFolder): void {
    this.internalFolders.update(f => [...f, folder]);
  }

  // ── Version upload ────────────────────────────────────────────
  protected openVersionUpload(doc: CaseDocument): void {
    this.versionTarget.set(doc);
  }

  protected onVersionSubmitted(file: File): void {
    const target = this.versionTarget();
    if (!target) return;

    const now = new Date().toISOString();
    const uploader = this.auth.user()?.name ?? 'Usuario';
    const sizeKb = Math.round(file.size / 1024) || 1;
    const newVersionNum = target.currentVersion + 1;

    this.internalDocs.update(docs => docs.map(d => {
      if (d.id !== target.id) return d;
      return {
        ...d, sizeKb, uploadedBy: uploader, uploadedAt: now,
        currentVersion: newVersionNum,
        versions: [...d.versions, { versionNumber: newVersionNum, sizeKb, uploadedBy: uploader, uploadedAt: now }],
      };
    }));

    this.expandedVersions.update(s => new Set(s).add(target.id));
    this.versionTarget.set(null);
  }

  protected deleteDoc(doc: CaseDocument): void {
    this.internalDocs.update(docs => docs.filter(d => d.id !== doc.id));
  }

  // ── New folder (top bar) ──────────────────────────────────────
  protected cancelNewFolder(): void {
    this.newFolderName = '';
    this.showNewFolder.set(false);
  }

  protected submitNewFolder(): void {
    const name = this.newFolderName.trim();
    if (!name) return;
    const newFolder: CaseFolder = { id: `folder-local-${Date.now()}`, name };
    this.internalFolders.update(f => [...f, newFolder]);
    this.activeFolderKey.set(newFolder.id);
    this.newFolderName = '';
    this.showNewFolder.set(false);
  }
}
