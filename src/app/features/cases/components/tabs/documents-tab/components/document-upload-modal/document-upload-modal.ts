import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { FormsModule } from '@angular/forms';
import { CaseFolder, DocumentType } from '../../../../../models/case.model';
import { DropdownComponent } from '../../../../../../../shared/design-system/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../../../shared/design-system/models/components.model';
import { formatSize } from '../../document-format.utils';

export interface UploadSubmitEvent {
  file: File;
  name: string;
  docType: DocumentType;
  folderId: string | null;
}

@Component({
  selector: 'app-document-upload-modal',
  templateUrl: './document-upload-modal.html',
  standalone: true,
  imports: [NgIcon, FormsModule, DropdownComponent],
})
export class DocumentUploadModalComponent implements OnChanges {
  @Input() folders: CaseFolder[] = [];
  @Input() preselectedFolderId: string | null = null;
  @Input() preselectedFile: File | null = null;

  @Output() submitted     = new EventEmitter<UploadSubmitEvent>();
  @Output() closed        = new EventEmitter<void>();
  @Output() folderCreated = new EventEmitter<CaseFolder>();

  protected uploadFile: File | null = null;
  protected uploadName = '';
  protected uploadDocType: string | null = null;
  protected uploadFolderId: string | null = null;
  protected isDragging = signal(false);
  protected showNewFolder = signal(false);
  protected newFolderName = '';

  protected readonly formatSize = formatSize;

  protected readonly docTypeOptions: DropdownOption[] = [
    { value: 'escrito',         label: 'Escrito judicial' },
    { value: 'contrato',        label: 'Contrato' },
    { value: 'sentencia',       label: 'Sentencia / Resolución' },
    { value: 'pericia',         label: 'Pericia' },
    { value: 'notificacion',    label: 'Cédula / Notificación' },
    { value: 'poder',           label: 'Poder notarial' },
    { value: 'factura',         label: 'Factura / Honorarios' },
    { value: 'correspondencia', label: 'Correspondencia' },
    { value: 'prueba',          label: 'Prueba / Evidencia' },
    { value: 'otro',            label: 'Otro' },
  ];

  protected get folderOptions(): DropdownOption[] {
    return [
      { value: '', label: 'Sin carpeta' },
      ...this.folders.map(f => ({ value: f.id, label: f.name })),
    ];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preselectedFile'] || changes['preselectedFolderId']) {
      this.uploadFile    = this.preselectedFile ?? null;
      this.uploadName    = this.preselectedFile ? this.preselectedFile.name.replace(/\.[^/.]+$/, '') : '';
      this.uploadDocType = null;
      this.uploadFolderId = this.preselectedFolderId ?? '';
      this.showNewFolder.set(false);
      this.newFolderName = '';
    }
  }

  protected onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(true);
  }

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    this.uploadFile = file;
    if (!this.uploadName) this.uploadName = file.name.replace(/\.[^/.]+$/, '');
  }

  protected onFileSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadFile = file;
    if (!this.uploadName) this.uploadName = file.name.replace(/\.[^/.]+$/, '');
  }

  protected createFolder(): void {
    const name = this.newFolderName.trim();
    if (!name) return;
    const folder: CaseFolder = { id: `folder-local-${Date.now()}`, name };
    this.folderCreated.emit(folder);
    this.uploadFolderId = folder.id;
    this.newFolderName = '';
    this.showNewFolder.set(false);
  }

  protected submit(): void {
    if (!this.uploadFile || !this.uploadDocType) return;
    this.submitted.emit({
      file:     this.uploadFile,
      name:     this.uploadName.trim() || this.uploadFile.name.replace(/\.[^/.]+$/, ''),
      docType:  this.uploadDocType as DocumentType,
      folderId: this.uploadFolderId || null,
    });
  }
}
