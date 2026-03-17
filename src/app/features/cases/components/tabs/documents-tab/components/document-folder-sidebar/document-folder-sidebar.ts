import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

export interface FolderSidebarItem {
  key: string;
  label: string;
  count: number;
}

@Component({
  selector: 'app-document-folder-sidebar',
  templateUrl: './document-folder-sidebar.html',
  standalone: true,
  imports: [NgIcon],
  host: { class: 'block' },
})
export class DocumentFolderSidebarComponent {
  @Input({ required: true }) items: FolderSidebarItem[] = [];
  @Input({ required: true }) activeKey = '';

  @Output() folderSelect = new EventEmitter<string>();
}
