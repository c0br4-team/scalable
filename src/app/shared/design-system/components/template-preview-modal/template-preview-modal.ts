import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  ViewChild,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'sce-template-preview-modal',
  templateUrl: './template-preview-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, TranslatePipe],
})
export class TemplatePreviewModalComponent implements AfterViewChecked {
  html = input.required<string>();
  title = input<string>('SHARED.PREVIEW_TITLE');
  close = output<void>();

  @ViewChild('previewFrame') private frameRef!: ElementRef<HTMLIFrameElement>;

  private lastHtml = '';

  ngAfterViewChecked(): void {
    const current = this.html();
    if (!this.frameRef || current === this.lastHtml) return;
    this.lastHtml = current;
    this.writeToFrame(current);
  }

  private writeToFrame(html: string): void {
    const doc = this.frameRef.nativeElement.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  }
}
