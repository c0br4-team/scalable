import { Component, Input } from '@angular/core';
import { Case } from '../../../models/case.model';

@Component({
  selector: 'app-case-description-tab',
  templateUrl: './description-tab.html',
  standalone: true,
})
export class CaseDescriptionTabComponent {
  @Input() case!: Case;
}
