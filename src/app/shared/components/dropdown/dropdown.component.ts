import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'sce-dropdown',
  templateUrl: './dropdown.component.html',
  standalone: true
})
export class DropdownComponent implements OnInit {
  @Input() options: string[] = [];
  @Input() placeholder: string = 'Select';

  @Output() selectedOptionChange = new EventEmitter<string | null>();
  selectedOption: string | null = null;

  constructor() { }

  ngOnInit() {
  }

}
