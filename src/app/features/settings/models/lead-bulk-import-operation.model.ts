export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface LeadBulkImportOperationListItem {
  operationId: string;
  requestedByName: string;
  requestedByUserIdAw: string;
  status: string;
  receivedCount: number;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  requestedAtUtc: string;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
}

export interface LeadBulkImportOperationDetail extends LeadBulkImportOperationListItem {
  errorMessage: string | null;
}
