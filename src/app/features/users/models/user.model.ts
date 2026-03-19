export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  labels: string[];
}

export interface UpdateUserRequest {
  name: string;
  labels: string[];
}
