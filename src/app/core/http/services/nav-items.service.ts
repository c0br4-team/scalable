import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateNavItemRequest, NavItemConfig, PagedNavItems, UpdateNavItemRequest } from '../../../features/settings/models/nav-item-config.model';
import { DropdownOption } from '../../../shared/design-system/models/components.model';

@Injectable({ providedIn: 'root' })
export class NavItemsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/nav-items`;

  getNavItems(page = 1, pageSize = 20, search?: string): Observable<PagedNavItems> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PagedNavItems>(this.baseUrl, { params });
  }

  getNavItem(id: string): Observable<NavItemConfig> {
    return this.http.get<NavItemConfig>(`${this.baseUrl}/${id}`);
  }

  searchParentOptions(search: string, excludeId?: string, pageSize = 20): Observable<DropdownOption[]> {
    return this.getNavItems(1, pageSize, search).pipe(
      map(response => response.items
        .filter(item => item.id !== excludeId)
        .map(item => ({
          label: item.label ?? item.path ?? item.type,
          value: item.id,
        })))
    );
  }

  createNavItem(body: CreateNavItemRequest): Observable<NavItemConfig> {
    return this.http.post<NavItemConfig>(this.baseUrl, body);
  }

  updateNavItem(id: string, body: UpdateNavItemRequest): Observable<NavItemConfig> {
    return this.http.put<NavItemConfig>(`${this.baseUrl}/${id}`, body);
  }

  deleteNavItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
