import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SKIP_GLOBAL_LOADING } from '../../../core/interceptors/loading.interceptor';
import { LeadDetail, LeadListItem, PagedLeads, SaveLeadIntakeRequest, CreateLeadRequest, CreateLeadResponse } from '../models/lead.model';

interface UpdateLeadAssigneeRequest {
  assignedUserIdAw: string | null;
}

@Injectable({ providedIn: 'root' })
export class LeadService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/leads`;

  getLeads(
    page = 1,
    pageSize = 10,
    search?: string,
    statuses?: string[],
    assignedUser?: string,
    source?: 'sheet' | 'manual',
    sortBy = 'date',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Observable<PagedLeads> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize)
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (search?.trim()) params = params.set('search', search.trim());
    if (statuses?.length) {
      for (const status of statuses) {
        params = params.append('statuses', status);
      }
    }
    if (assignedUser?.trim()) params = params.set('assignedUser', assignedUser.trim());
    if (source) params = params.set('source', source);

    return this.http.get<PagedLeads>(this.apiUrl, {
      params,
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, true),
    });
  }

  getLeadDetail(leadRef: string | number): Observable<LeadDetail> {
    return this.http.get<LeadDetail>(`${this.apiUrl}/${encodeURIComponent(String(leadRef))}`);
  }

  saveIntake(leadRef: string | number, data: SaveLeadIntakeRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${encodeURIComponent(String(leadRef))}/intake`, data);
  }

  updateAssignedUser(leadRef: string | number, assignedUserIdAw: string | null): Observable<void> {
    const payload: UpdateLeadAssigneeRequest = { assignedUserIdAw };
    return this.http.patch<void>(`${this.apiUrl}/${encodeURIComponent(String(leadRef))}/assignee`, payload);
  }

  syncLeads(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/sync`, null, {
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, true),
    });
  }

  createLead(data: CreateLeadRequest): Observable<CreateLeadResponse> {
    return this.http.post<CreateLeadResponse>(this.apiUrl, data);
  }
}
