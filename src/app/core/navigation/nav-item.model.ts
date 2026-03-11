export interface BasicNavItem {
  type: 'basic';
  label: string;
  path: string;
  icon?: string;
  badge?: string | number;
  badgeType?: 'primary' | 'success' | 'warning' | 'danger';
  exactPath?: boolean;
}

export interface CollapsibleNavItem {
  type: 'collapsible';
  label: string;
  icon?: string;
  children: BasicNavItem[];
}

export interface GroupNavItem {
  type: 'group';
  label: string;
  children: (BasicNavItem | CollapsibleNavItem | DividerNavItem)[];
}

export interface DividerNavItem {
  type: 'divider';
}

export type NavItem = BasicNavItem | CollapsibleNavItem | GroupNavItem | DividerNavItem;
