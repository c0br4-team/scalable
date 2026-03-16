import { Injectable, signal } from '@angular/core';
import { Subject, switchMap, debounceTime, distinctUntilChanged, filter, tap, catchError, EMPTY } from 'rxjs';
import { DropdownOption, DropdownSearchFn } from '../models/components.model';

@Injectable()
export class DropdownSearchService {
  readonly results = signal<DropdownOption[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  private query$ = new Subject<string>();
  private subscription = this.query$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    filter(q => q.trim().length >= 2),
    tap(() => {
      this.isLoading.set(true);
      this.error.set(null);
    }),
    switchMap(q =>
      this.searchFn(q).pipe(
        catchError(() => {
          this.error.set('Error fetching results');
          return EMPTY;
        })
      )
    ),
    tap(() => this.isLoading.set(false)),
  ).subscribe(options => this.results.set(options));

  private searchFn!: DropdownSearchFn;

  configure(searchFn: DropdownSearchFn, debounceMs = 300, minChars = 2): void {
    this.searchFn = searchFn;

    this.subscription.unsubscribe();
    this.subscription = this.query$.pipe(
      debounceTime(debounceMs),
      distinctUntilChanged(),
      filter(q => q.trim().length >= minChars),
      tap(() => {
        this.isLoading.set(true);
        this.error.set(null);
      }),
      switchMap(q =>
        this.searchFn(q).pipe(
          catchError(() => {
            this.error.set('Error fetching results');
            this.isLoading.set(false);
            return EMPTY;
          })
        )
      ),
      tap(() => this.isLoading.set(false)),
    ).subscribe(options => this.results.set(options));
  }

  search(query: string): void {
    if (!query.trim()) {
      this.results.set([]);
      this.isLoading.set(false);
      return;
    }
    this.query$.next(query);
  }

  reset(): void {
    this.results.set([]);
    this.isLoading.set(false);
    this.error.set(null);
  }

  destroy(): void {
    this.subscription.unsubscribe();
    this.query$.complete();
  }
}
