export interface NavItemConfig {
  id: string;
  type: 'basic' | 'collapsible' | 'group' | 'divider';
  label: string | null;
  path: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateNavItemRequest {
  type: 'basic' | 'collapsible' | 'group' | 'divider';
  label?: string | null;
  path?: string | null;
  icon?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface UpdateNavItemRequest extends CreateNavItemRequest {}

export interface PagedNavItems {
  items: NavItemConfig[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
