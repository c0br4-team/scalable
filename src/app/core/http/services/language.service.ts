import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DropdownOption } from '../../../shared/design-system/models/components.model';
import { environment } from '../../../../environments/environment';

interface LanguageListItem {
  id: string;
  code: string;
  nameEn: string;
  nameEs: string;
}

interface PagedResponse<T> {
  items: T[];
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/languages`;

  search(query: string): Observable<DropdownOption[]> {
    const params = new HttpParams().set('search', query).set('pageSize', '20');
    return this.http.get<PagedResponse<LanguageListItem>>(this.baseUrl, { params }).pipe(
      map(res => res.items.map(l => ({ label: `${l.nameEs} / ${l.nameEn}`, value: l.code })))
    );
  }
}
