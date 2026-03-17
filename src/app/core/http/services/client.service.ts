import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DropdownOption } from '../../../shared/design-system/models/components.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/clients`;

  search(query: string): Observable<DropdownOption[]> {
    const params = new HttpParams().set('name_like', query).set('_limit', '10');
    return this.http.get<{ id: string; name: string }[]>(this.baseUrl, { params }).pipe(
      map(clients => clients.map(c => ({ label: c.name, value: c.id })))
    );
  }
}
