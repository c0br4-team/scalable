import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface LegalCategoryOption {
  code: string;
  nameEs: string;
  nameEn: string;
}

interface LegalCategoryListItem {
  id: string;
  code: string;
  nameEn: string;
  nameEs: string;
}

interface PagedResponse<T> {
  items: T[];
}

@Injectable({ providedIn: 'root' })
export class LegalCategoryService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/legal-categories`;

  getAll(): Observable<LegalCategoryOption[]> {
    return this.http.get<PagedResponse<LegalCategoryListItem>>(this.baseUrl, {
      params: { pageSize: '100' }
    }).pipe(
      map(res => res.items.map(c => ({ code: c.code, nameEs: c.nameEs, nameEn: c.nameEn })))
    );
  }
}
