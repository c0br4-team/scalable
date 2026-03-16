import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { DropdownOption } from '../../../shared/design-system/models/components.model';

// Simulación local hasta tener la API lista
const MOCK_CLIENTS = [
  { id: '1', name: 'Acme Corp' },
  { id: '2', name: 'Oscorp Inc' },
  { id: '3', name: 'Initech LLC' },
  { id: '4', name: 'Oscorp Co' },
  { id: '4', name: 'Oscorp Co' },
  { id: '4', name: 'Oscorp Co' },
  { id: '4', name: 'Oscorp Co' },
  { id: '4', name: 'Oscorp Co' },
  { id: '4', name: 'Oscorp Co' },
  { id: '4', name: 'Oscorp Co' },
  { id: '4', name: 'Oscorp Co' },
  { id: '4', name: 'Oscorp Co' },
  { id: '5', name: 'Oscorp Industries' },
  { id: '6', name: 'Wayne Enterprises' },
  { id: '7', name: 'Oscorp' },
  { id: '8', name: 'LexCorp' },
];

@Injectable({ providedIn: 'root' })
export class ClientService {
  private http = inject(HttpClient);
  private readonly BASE_URL = '/api/clients';
  private readonly USE_MOCK = true; // cambiar a false cuando la API esté lista

  search(query: string): Observable<DropdownOption[]> {
    if (this.USE_MOCK) return this.mockSearch(query);

    const params = new HttpParams().set('q', query).set('limit', '10');
    return this.http.get<{ id: string; name: string }[]>(this.BASE_URL, { params }).pipe(
      map(clients => clients.map(c => ({ label: c.name, value: c.id })))
    );
  }

  private mockSearch(query: string): Observable<DropdownOption[]> {
    const results = MOCK_CLIENTS
      .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
      .map(c => ({ label: c.name, value: c.id }));
    return of(results).pipe(delay(600)); // simula latencia de red
  }
}
