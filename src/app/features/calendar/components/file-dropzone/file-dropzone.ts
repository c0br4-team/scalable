import {
  Component, ElementRef, inject, input, output, signal, viewChild
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Attachment } from '../../models/activity.model';
import { ActivityService } from '../../services/activity.service';
import { AuthService } from '../../../../core/auth/services/auth.service';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Component({
  selector: 'app-file-dropzone',
  imports: [NgIcon],
  templateUrl: './file-dropzone.html',
})
export class FileDropzoneComponent {
  private activityService = inject(ActivityService);
  private auth = inject(AuthService);

  activityId = input.required<string>();
  attachments = input<Attachment[]>([]);

  private fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  protected isDragging = signal(false);
  protected errors = signal<string[]>([]);

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = Array.from(event.dataTransfer?.files ?? []);
    this._processFiles(files);
  }

  protected openFilePicker(): void {
    this.fileInput().nativeElement.click();
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this._processFiles(files);
    input.value = ''; // reset para permitir re-selección del mismo archivo
  }

  protected removeAttachment(attachmentId: string): void {
    const performer = this.auth.user()?.name ?? 'Sistema';
    this.activityService.removeAttachment(this.activityId(), attachmentId, performer);
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected isImage(attachment: Attachment): boolean {
    return attachment.type.startsWith('image/');
  }

  protected fileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'heroPhoto';
    if (mimeType === 'application/pdf') return 'heroDocument';
    return 'heroPaperClip';
  }

  protected fileIconColor(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'text-emerald-500';
    if (mimeType === 'application/pdf') return 'text-red-500';
    return 'text-blue-500';
  }

  private _processFiles(files: File[]): void {
    const newErrors: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        newErrors.push(`"${file.name}" — tipo de archivo no permitido.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        newErrors.push(`"${file.name}" — supera el límite de 10 MB.`);
        continue;
      }
      if (this.attachments().some(a => a.name === file.name && a.size === file.size)) {
        newErrors.push(`"${file.name}" — ya fue adjuntado.`);
        continue;
      }

      const url = URL.createObjectURL(file);
      const performer = this.auth.user()?.name ?? 'Sistema';

      this.activityService.addAttachment(
        this.activityId(),
        { name: file.name, size: file.size, type: file.type, url },
        performer
      );
    }

    this.errors.set(newErrors);
    if (newErrors.length) {
      setTimeout(() => this.errors.set([]), 5000);
    }
  }
}
