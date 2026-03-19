import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AppUser, CreateUserRequest, UpdateUserRequest } from '../../../features/users/models/user.model';

interface ApiUser {
  id: string;
  name: string;
  email: string;
  labels: string[];
  status: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  getAll(): Observable<AppUser[]> {
    return this.http.get<ApiUser[]>(this.baseUrl).pipe(
      map(users => users.map(this.mapUser))
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
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.labels?.[0] ?? 'user',
      status: u.status,
      createdAt: u.createdAt,
    };
  }
}
