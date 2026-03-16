import {
  Component, output, input, model, OnDestroy, OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'sce-search-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-bar.component.html',
})
export class SearchBarComponent implements OnInit, OnDestroy {
  placeholder  = input<string>('Search');
  debounceMs   = input<number>(300);
  disabled     = input<boolean>(false);

  /** Two-way binding: [(value)]="query" */
  value = model<string>('');

  /** Emits after debounce — ideal para llamadas HTTP */
  search = output<string>();

  /** Emite inmediatamente al limpiar */
  cleared = output<void>();

  private input$ = new Subject<string>();
  private sub = this.input$
    .pipe(debounceTime(0), distinctUntilChanged())
    .subscribe();         // se reconfigura en ngOnInit

  ngOnInit(): void {
    this.sub.unsubscribe();
    this.sub = this.input$
      .pipe(debounceTime(this.debounceMs()), distinctUntilChanged())
      .subscribe(v => this.search.emit(v));
  }

  protected onInput(raw: string): void {
    this.value.set(raw);
    this.input$.next(raw);
  }

  protected clear(): void {
    this.value.set('');
    this.input$.next('');
    this.cleared.emit();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.input$.complete();
  }
}
