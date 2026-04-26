import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PagedResponse,
  RoleAccessResponse,
  RoleListItem,
  UpdateRoleAccessRequest,
} from '../../../features/settings/models/role-access.model';

@Injectable({ providedIn: 'root' })
export class RoleAccessService {
  private http = inject(HttpClient);
  private readonly rolesUrl = `${environment.apiUrl}/roles`;

  getRoles(page = 1, pageSize = 100, search?: string): Observable<PagedResponse<RoleListItem>> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PagedResponse<RoleListItem>>(this.rolesUrl, { params });
  }

  getRoleAccess(roleId: string): Observable<RoleAccessResponse> {
    return this.http.get<RoleAccessResponse>(`${this.rolesUrl}/${roleId}/access`);
  }

  updateRoleAccess(roleId: string, body: UpdateRoleAccessRequest): Observable<RoleAccessResponse> {
    return this.http.put<RoleAccessResponse>(`${this.rolesUrl}/${roleId}/access`, body);
  }
}
