import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[sceTableCell]',
  standalone: true,
})
export class TableCellDirective {
  @Input('sceTableCell') key!: string;
  constructor(public template: TemplateRef<any>) {}
}
