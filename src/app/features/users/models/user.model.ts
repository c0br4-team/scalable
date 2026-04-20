export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  otpEnabled: boolean;
  otpConfigured: boolean;
  otpStatus: string;
  otpMode: 'enabled' | 'disabled';
}

export interface PagedUsers {
  items: AppUser[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  labels: string[];
  otpRequired: boolean;
}

export interface UpdateUserRequest {
  name: string;
  labels: string[];
  otpRequired: boolean;
  isActive?: boolean;
}
