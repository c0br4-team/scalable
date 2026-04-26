export interface CatalogConfig {
  id: number;
  tableName: string;
  keyField: string;
  valueField: string;
  conditions: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CatalogQueryItem {
  key: string;
  value: string;
}

export interface CreateCatalogConfigRequest {
  tableName: string;
  keyField: string;
  valueField: string;
  conditions?: string | null;
  description?: string | null;
}

export interface UpdateCatalogConfigRequest {
  tableName: string;
  keyField: string;
  valueField: string;
  conditions?: string | null;
  description?: string | null;
}

export interface PagedCatalogConfigs {
  items: CatalogConfig[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
