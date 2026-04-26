import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LeadBulkImportOperationDetail, LeadBulkImportOperationListItem, PagedResponse } from '../../../features/settings/models/lead-bulk-import-operation.model';

@Injectable({ providedIn: 'root' })
export class LeadBulkImportOperationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/leads/bulk-import-operations`;

  getOperations(page = 1, pageSize = 20, search?: string, status?: string): Observable<PagedResponse<LeadBulkImportOperationListItem>> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    if (status?.trim()) {
      params = params.set('status', status.trim());
    }

    return this.http.get<PagedResponse<LeadBulkImportOperationListItem>>(this.baseUrl, { params });
  }

  getOperation(operationId: string): Observable<LeadBulkImportOperationDetail> {
    return this.http.get<LeadBulkImportOperationDetail>(`${this.baseUrl}/${encodeURIComponent(operationId)}`);
  }
}
