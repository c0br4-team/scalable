export interface LeadListItem {
  leadId: string;
  rowIndex: number | null;
  date: string | null;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  status: 'new' | 'in_progress' | 'converted';
  sourceStatus: 'active' | 'removed_from_source' | 'legacy' | 'manual';
  hasIntake: boolean;
  assignedUserName: string | null;
}

export interface PagedLeads {
  items: LeadListItem[];
  total: number;
  pageNumber: number;
  pageSize: number;
}

export interface LeadIntakeForm {
  intakeId: string;
  clientId: string;
  fullName: string;
  identificationNumber: string | null;
  dateOfBirth: string | null;
  countryOfBirth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  zipCode: string | null;
  intakeDate: string | null;
  maritalStatus: string | null;
  firstEntryDateToUSA: string | null;
  hasEnteredMultipleTimes: boolean | null;
  hasBeenArrested: boolean | null;
  arrestDate: string | null;
  hasBeenMarriedToUSCitizen: boolean | null;
  hasChildrenWithUSStatus: boolean | null;
  currentMigrationStatus: string | null;
  preferredLanguage: string | null;
  history: string | null;
  legalCategoryIds: string[];
  updatedAt: string | null;
}

export interface LeadDetail {
  leadId: string;
  rowIndex: number | null;
  date: string | null;
  fullName: string | null;
  identificationNumber: string | null;
  dateOfBirth: string | null;
  countryOfBirth: string | null;
  phone: string | null;
  email: string | null;
  addressZip: string | null;
  status: 'new' | 'in_progress' | 'converted';
  sourceStatus: 'active' | 'removed_from_source' | 'legacy' | 'manual';
  assignedUserIdAw: string | null;
  assignedUserName: string | null;
  intake: LeadIntakeForm | null;
}

export interface SaveLeadIntakeRequest {
  fullName: string;
  identificationNumber: string | null;
  dateOfBirth: string | null;
  countryOfBirth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  zipCode: string | null;
  maritalStatus: string | null;
  firstEntryDateToUSA: string | null;
  hasEnteredMultipleTimes: boolean | null;
  hasBeenArrested: boolean | null;
  arrestDate: string | null;
  hasBeenMarriedToUSCitizen: boolean | null;
  hasChildrenWithUSStatus: boolean | null;
  currentMigrationStatus: string | null;
  preferredLanguage: string | null;
  history: string | null;
  legalCategoryIds: string[];
  assignedUserIdAw: string | null;
}

export interface LeadFilters {
  search: string;
  status: string[];
}

export interface CreateLeadRequest {
  fullName: string;
  phone: string | null;
  email: string | null;
  assignedUserIdAw: string | null;
  history: string | null;
}

export interface CreateLeadResponse {
  leadId: string;
}
