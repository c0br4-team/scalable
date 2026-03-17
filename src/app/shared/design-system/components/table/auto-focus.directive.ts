import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[sceAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective {
  constructor(el: ElementRef<HTMLElement>) {
    setTimeout(() => el.nativeElement.focus(), 0);
  }
}
