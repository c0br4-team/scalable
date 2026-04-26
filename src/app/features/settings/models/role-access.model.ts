export interface RoleListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface RoleAccessPermission {
  id: string;
  code: string;
  description: string | null;
  assigned: boolean;
}

export interface RoleAccessNavItem {
  id: string;
  type: 'basic' | 'collapsible' | 'group' | 'divider';
  label: string;
  path: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  depth: number;
  assigned: boolean;
}

export interface RoleAccessResponse {
  roleId: string;
  roleCode: string;
  roleName: string;
  permissions: RoleAccessPermission[];
  navItems: RoleAccessNavItem[];
}

export interface UpdateRoleAccessRequest {
  permissionIds: string[];
  navItemIds: string[];
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
