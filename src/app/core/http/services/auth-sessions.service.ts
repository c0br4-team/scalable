import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthSessionDetail, AuthSessionListItem, PagedResponse } from '../../../features/settings/models/auth-session.model';

@Injectable({ providedIn: 'root' })
export class AuthSessionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth-sessions`;

  getSessions(page = 1, pageSize = 20, search?: string, status?: string, onlyOpen = false): Observable<PagedResponse<AuthSessionListItem>> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize)
      .set('sortBy', 'startedAtUtc')
      .set('sortDescending', true)
      .set('onlyOpen', onlyOpen);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    if (status?.trim()) {
      params = params.set('status', status.trim());
    }

    return this.http.get<PagedResponse<AuthSessionListItem>>(this.baseUrl, { params });
  }

  getSession(sessionPublicId: string): Observable<AuthSessionDetail> {
    return this.http.get<AuthSessionDetail>(`${this.baseUrl}/${encodeURIComponent(sessionPublicId)}`);
  }

  getCurrentSession(): Observable<AuthSessionDetail> {
    return this.http.get<AuthSessionDetail>(`${this.baseUrl}/current`);
  }

  revokeSession(sessionPublicId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${encodeURIComponent(sessionPublicId)}/revoke`, {});
  }
}
