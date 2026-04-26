import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ContractedService, DownpaymentMethod } from '../../../features/lead/models/lead.model';
import { SKIP_GLOBAL_LOADING } from '../../interceptors/loading.interceptor';
import {
  CatalogConfig, CatalogQueryItem, CreateCatalogConfigRequest,
  UpdateCatalogConfigRequest, PagedCatalogConfigs
} from '../../../features/settings/models/catalog-config.model';
import { DropdownOption, DropdownSearchFn } from '../../../shared/design-system/models/components.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private readonly baseUrl      = `${environment.apiUrl}/catalogs`;
  private readonly configUrl    = `${environment.apiUrl}/catalog-config`;

  getContractedServices(): Observable<ContractedService[]> {
    return this.http.get<ContractedService[]>(`${this.baseUrl}/contracted-services`);
  }

  getDownpaymentMethods(): Observable<DownpaymentMethod[]> {
    return this.http.get<DownpaymentMethod[]>(`${this.baseUrl}/downpayment-methods`);
  }

  // ── Dynamic Catalog Config CRUD ──────────────────────────────────────────

  getConfigs(page = 1, pageSize = 20, search?: string): Observable<PagedCatalogConfigs> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search?.trim()) params = params.set('search', search.trim());
    return this.http.get<PagedCatalogConfigs>(this.configUrl, { params });
  }

  createConfig(body: CreateCatalogConfigRequest): Observable<CatalogConfig> {
    return this.http.post<CatalogConfig>(this.configUrl, body);
  }

  updateConfig(id: number, body: UpdateCatalogConfigRequest): Observable<CatalogConfig> {
    return this.http.put<CatalogConfig>(`${this.configUrl}/${id}`, body);
  }

  deleteConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.configUrl}/${id}`);
  }

  // ── Generic Dynamic Query ─────────────────────────────────────────────────

  query(catalogId: number, search: string, limit = 20): Observable<CatalogQueryItem[]> {
    const context = new HttpContext().set(SKIP_GLOBAL_LOADING, true);
    const params  = new HttpParams()
      .set('catalogId', catalogId)
      .set('search', search)
      .set('limit', limit);
    return this.http.get<CatalogQueryItem[]>(`${this.baseUrl}/query`, { params, context });
  }

  queryByTable(tableName: string, search: string, limit = 20): Observable<CatalogQueryItem[]> {
    const context = new HttpContext().set(SKIP_GLOBAL_LOADING, true);
    const params  = new HttpParams()
      .set('tableName', tableName)
      .set('search', search)
      .set('limit', limit);
    return this.http.get<CatalogQueryItem[]>(`${this.baseUrl}/query`, { params, context });
  }

  /** Returns a DropdownSearchFn bound to a specific catalogId for use with sce-dropdown. */
  createSearchFn(catalogId: number, limit = 20): DropdownSearchFn {
    return (search: string) =>
      this.query(catalogId, search, limit).pipe(
        map(items => items.map(i => ({ label: i.value, value: i.key } as DropdownOption)))
      );
  }
}
