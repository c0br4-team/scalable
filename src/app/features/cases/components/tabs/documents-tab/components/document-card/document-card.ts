import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { CaseDocument } from '../../../../../models/case.model';
import {
  iconForType, colorForType, bgForType,
  docTypeLabelShort, docTypeCls, formatSize, formatDate,
} from '../../document-format.utils';

@Component({
  selector: 'app-document-card',
  templateUrl: './document-card.html',
  standalone: true,
  imports: [NgIcon],
})
export class DocumentCardComponent {
  @Input({ required: true }) doc!: CaseDocument;
  @Input() folderName: string | null = null;
  @Input() showFolderBadge = false;
  @Input() isVersionExpanded = false;
  @Input() canDownload = false;
  @Input() canUploadVersion = false;
  @Input() canDelete = false;

  @Output() toggleVersions    = new EventEmitter<string>();
  @Output() requestNewVersion = new EventEmitter<CaseDocument>();
  @Output() deleteDocument    = new EventEmitter<CaseDocument>();

  protected readonly iconForType      = iconForType;
  protected readonly colorForType     = colorForType;
  protected readonly bgForType        = bgForType;
  protected readonly docTypeLabelShort = docTypeLabelShort;
  protected readonly docTypeCls       = docTypeCls;
  protected readonly formatSize       = formatSize;
  protected readonly formatDate       = formatDate;
}
