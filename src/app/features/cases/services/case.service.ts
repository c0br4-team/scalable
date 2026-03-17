import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Case } from '../models/case.model';

@Injectable({ providedIn: 'root' })
export class CaseService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/cases`;

  getAll(): Observable<Case[]> {
    return this.http.get<Case[]>(this.baseUrl);
  }

  getById(id: string): Observable<Case> {
    return this.http.get<Case>(`${this.baseUrl}/${id}`);
  }
}
