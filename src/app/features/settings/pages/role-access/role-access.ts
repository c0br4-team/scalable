import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SearchBarComponent } from '../../../../shared/design-system/components/search-bar/search-bar.component';
import { ToastService } from '../../../../core/services/toast.service';
import { RoleAccessService } from '../../../../core/http/services/role-access.service';
import { RoleAccessNavItem, RoleAccessPermission, RoleAccessResponse, RoleListItem } from '../../models/role-access.model';

@Component({
  selector: 'app-role-access-page',
  imports: [TranslatePipe, SearchBarComponent],
  templateUrl: './role-access.html',
  host: { class: 'flex flex-1 min-h-0 flex-col overflow-hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleAccessPage {
  private readonly roleAccessService = inject(RoleAccessService);
  private readonly toast = inject(ToastService);

  protected readonly roles = signal<RoleListItem[]>([]);
  protected readonly access = signal<RoleAccessResponse | null>(null);
  protected readonly rolesLoading = signal(true);
  protected readonly accessLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly roleSearch = signal('');
  protected readonly permissionSearch = signal('');
  protected readonly navSearch = signal('');
  protected readonly selectedRoleId = signal<string | null>(null);

  protected readonly filteredRoles = computed(() => {
    const query = this.roleSearch().trim().toLowerCase();
    if (!query) {
      return this.roles();
    }

    return this.roles().filter(role =>
      role.name.toLowerCase().includes(query)
      || role.code.toLowerCase().includes(query)
      || (role.description ?? '').toLowerCase().includes(query)
    );
  });

  protected readonly filteredPermissions = computed(() => {
    const current = this.access()?.permissions ?? [];
    const query = this.permissionSearch().trim().toLowerCase();
    if (!query) {
      return current;
    }

    return current.filter(permission =>
      permission.code.toLowerCase().includes(query)
      || (permission.description ?? '').toLowerCase().includes(query)
    );
  });

  protected readonly filteredNavItems = computed(() => {
    const current = this.access()?.navItems ?? [];
    const query = this.navSearch().trim().toLowerCase();
    if (!query) {
      return current;
    }

    return current.filter(item =>
      item.label.toLowerCase().includes(query)
      || (item.path ?? '').toLowerCase().includes(query)
      || item.type.toLowerCase().includes(query)
    );
  });

  constructor()
  {
    this.loadRoles();
  }

  protected selectRole(roleId: string): void {
    if (this.selectedRoleId() === roleId) {
      return;
    }

    this.selectedRoleId.set(roleId);
    this.loadRoleAccess(roleId);
  }

  protected onRoleSearch(query: string): void {
    this.roleSearch.set(query);
  }

  protected onPermissionSearch(query: string): void {
    this.permissionSearch.set(query);
  }

  protected onNavSearch(query: string): void {
    this.navSearch.set(query);
  }

  protected togglePermission(permissionId: string, checked: boolean): void {
    this.access.update(current => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        permissions: current.permissions.map(permission =>
          permission.id === permissionId ? { ...permission, assigned: checked } : permission),
      };
    });
  }

  protected toggleNavItem(navItemId: string, checked: boolean): void {
    this.access.update(current => {
      if (!current) {
        return current;
      }

      const items = current.navItems.map(item => ({ ...item }));
      const itemMap = new Map(items.map(item => [item.id, item]));

      if (checked) {
        let cursor = itemMap.get(navItemId) ?? null;
        while (cursor) {
          cursor.assigned = true;
          cursor = cursor.parentId ? itemMap.get(cursor.parentId) ?? null : null;
        }
      } else {
        const descendants = this.collectDescendantIds(navItemId, items);
        descendants.add(navItemId);

        for (const id of descendants) {
          const item = itemMap.get(id);
          if (item) {
            item.assigned = false;
          }
        }

        let parentId = itemMap.get(navItemId)?.parentId ?? null;
        while (parentId) {
          const parent = itemMap.get(parentId);
          if (!parent) {
            break;
          }

          const hasAssignedChildren = items.some(item => item.parentId === parentId && item.assigned);
          if (hasAssignedChildren) {
            break;
          }

          parent.assigned = false;
          parentId = parent.parentId;
        }
      }

      return {
        ...current,
        navItems: items,
      };
    });
  }

  protected save(): void {
    const current = this.access();
    const roleId = this.selectedRoleId();
    if (!current || !roleId || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.roleAccessService.updateRoleAccess(roleId, {
      permissionIds: current.permissions.filter(permission => permission.assigned).map(permission => permission.id),
      navItemIds: current.navItems.filter(item => item.assigned).map(item => item.id),
    }).subscribe({
      next: response => {
        this.access.set(response);
        this.saving.set(false);
        this.toast.success('ROLE_ACCESS.SAVED');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('ROLE_ACCESS.SAVE_ERROR');
      },
    });
  }

  protected trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  protected navItemIndent(depth: number): string {
    return `${depth * 1.25}rem`;
  }

  protected navItemLabel(item: RoleAccessNavItem): string {
    if (item.type === 'divider') {
      return 'ROLE_ACCESS.DIVIDER';
    }

    return item.label;
  }

  private loadRoles(): void {
    this.rolesLoading.set(true);
    this.roleAccessService.getRoles(1, 100).subscribe({
      next: response => {
        const roles = response.items;
        this.roles.set(roles);
        this.rolesLoading.set(false);

        if (!roles.length) {
          this.selectedRoleId.set(null);
          this.access.set(null);
          return;
        }

        const selectedRoleId = this.selectedRoleId() ?? roles[0].id;
        this.selectedRoleId.set(selectedRoleId);
        this.loadRoleAccess(selectedRoleId);
      },
      error: () => {
        this.rolesLoading.set(false);
        this.toast.error('ROLE_ACCESS.LOAD_ROLES_ERROR');
      },
    });
  }

  private loadRoleAccess(roleId: string): void {
    this.accessLoading.set(true);
    this.roleAccessService.getRoleAccess(roleId).subscribe({
      next: response => {
        this.access.set(response);
        this.accessLoading.set(false);
      },
      error: () => {
        this.accessLoading.set(false);
        this.toast.error('ROLE_ACCESS.LOAD_ACCESS_ERROR');
      },
    });
  }

  private collectDescendantIds(parentId: string, items: RoleAccessNavItem[]): Set<string> {
    const descendants = new Set<string>();
    const queue = items.filter(item => item.parentId === parentId).map(item => item.id);

    while (queue.length) {
      const nextId = queue.shift();
      if (!nextId || descendants.has(nextId)) {
        continue;
      }

      descendants.add(nextId);
      const children = items.filter(item => item.parentId === nextId).map(item => item.id);
      queue.push(...children);
    }

    return descendants;
  }
}
