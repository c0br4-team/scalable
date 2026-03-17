import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { CaseDocument } from '../../../../../models/case.model';
import { formatSize } from '../../document-format.utils';

@Component({
  selector: 'app-document-version-modal',
  templateUrl: './document-version-modal.html',
  standalone: true,
  imports: [NgIcon],
})
export class DocumentVersionModalComponent {
  @Input({ required: true }) targetDoc!: CaseDocument;

  @Output() submitted = new EventEmitter<File>();
  @Output() closed    = new EventEmitter<void>();

  protected versionFile: File | null = null;
  protected isDragging = signal(false);
  protected readonly formatSize = formatSize;

  protected onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(true);
  }

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.versionFile = file;
  }

  protected onFileSelected(e: Event): void {
    this.versionFile = (e.target as HTMLInputElement).files?.[0] ?? null;
  }

  protected submit(): void {
    if (this.versionFile) this.submitted.emit(this.versionFile);
  }
}
