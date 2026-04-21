import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ContractedService, DownpaymentMethod } from '../../../features/lead/models/lead.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/catalogs`;

  getContractedServices(): Observable<ContractedService[]> {
    return this.http.get<ContractedService[]>(`${this.baseUrl}/contracted-services`);
  }

  getDownpaymentMethods(): Observable<DownpaymentMethod[]> {
    return this.http.get<DownpaymentMethod[]>(`${this.baseUrl}/downpayment-methods`);
  }
}
