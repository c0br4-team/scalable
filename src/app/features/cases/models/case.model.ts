export type CaseStatus   = 'active' | 'pending' | 'closed' | 'suspended';
export type CaseType     = 'civil' | 'contratos' | 'laboral' | 'societario';
export type CasePriority = 'low' | 'medium' | 'high' | 'critical';
export type CaseTab      = 'description' | 'documents' | 'comments' | 'notes' | 'history';
export type DocumentType =
  | 'escrito' | 'contrato' | 'sentencia' | 'pericia'
  | 'notificacion' | 'poder' | 'factura' | 'correspondencia'
  | 'prueba' | 'otro';

export interface CaseDocumentVersion {
  versionNumber: number;
  sizeKb: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CaseFolder {
  id: string;
  name: string;
}

export interface CaseDocument {
  id: string;
  name: string;
  originalFileName: string;
  documentType: DocumentType;
  folderId: string | null;
  fileType: string;
  sizeKb: number;
  uploadedBy: string;
  uploadedAt: string;
  currentVersion: number;
  versions: CaseDocumentVersion[];
}

export interface CaseComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface CaseNote {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseHistoryEntry {
  id: string;
  action: string;
  description: string;
  performedBy: string;
  performedAt: string;
}

export interface Case {
  id: string;
  title: string;
  caseNumber: string;
  type: CaseType;
  status: CaseStatus;
  priority: CasePriority;
  clientId: string;
  clientName: string;
  assignedTo: string[];
  court: string | null;
  judge: string | null;
  openedAt: string;
  nextHearing: string | null;
  description: string;
  closedAt?: string;
  folders?: CaseFolder[];
  documents?: CaseDocument[];
  comments?: CaseComment[];
  notes?: CaseNote[];
  history?: CaseHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseFilters {
  search?: string;
  status?: CaseStatus[];
  type?: CaseType[];
  priority?: CasePriority[];
  dateFrom?: string;
  dateTo?: string;
}
