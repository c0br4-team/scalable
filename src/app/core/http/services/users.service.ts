import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SKIP_GLOBAL_LOADING } from '../../interceptors/loading.interceptor';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AppUser, CreateUserRequest, PagedUsers, UpdateUserRequest } from '../../../features/users/models/user.model';
import { DropdownOption } from '../../../shared/design-system/models/components.model';

interface ApiUser {
  id: string;
  name: string;
  email: string;
  labels: string[];
  status: string;
  createdAt: string;
  otpEnabled?: boolean;
  otpConfigured?: boolean;
}

interface ApiPagedUsers {
  items: ApiUser[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  search(query: string): Observable<DropdownOption[]> {
    const params = new HttpParams()
      .set('page', 1)
      .set('pageSize', 10)
      .set('search', query);
    const context = new HttpContext().set(SKIP_GLOBAL_LOADING, true);
    return this.http.get<ApiPagedUsers>(this.baseUrl, { params, context }).pipe(
      map(res => res.items.map(u => ({ label: u.name, value: u.id })))
    );
  }

  getAll(page = 1, pageSize = 20, search?: string): Observable<PagedUsers> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    if (search?.trim()) params = params.set('search', search.trim());

    return this.http.get<ApiPagedUsers>(this.baseUrl, { params }).pipe(
      map(res => ({
        items:      res.items.map(this.mapUser),
        page:       res.page,
        pageSize:   res.pageSize,
        totalCount: res.totalCount,
        totalPages: res.totalPages,
      }))
    );
  }

  create(request: CreateUserRequest): Observable<AppUser> {
    return this.http.post<ApiUser>(this.baseUrl, request).pipe(
      map(this.mapUser)
    );
  }

  update(id: string, request: UpdateUserRequest): Observable<AppUser> {
    return this.http.patch<ApiUser>(`${this.baseUrl}/${id}`, request).pipe(
      map(this.mapUser)
    );
  }

  private mapUser(u: ApiUser): AppUser {
    const otpEnabled = !!u.otpEnabled;
    const otpConfigured = !!u.otpConfigured;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.labels?.[0] ?? 'user',
      status: u.status,
      isActive: u.status === 'active',
      createdAt: u.createdAt,
      otpEnabled,
      otpConfigured,
      otpStatus: !otpEnabled ? 'Disabled' : otpConfigured ? 'Active' : 'Pending setup',
      otpMode: otpEnabled ? 'enabled' : 'disabled',
    };
  }
}
