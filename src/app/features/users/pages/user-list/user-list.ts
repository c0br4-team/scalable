import { Component, inject, signal, viewChild, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { EditableTableComponent, EditableColumnDef } from '../../../../shared/design-system/components/table';
import { SearchBarComponent } from '../../../../shared/design-system/components/search-bar/search-bar.component';
import { ToastService } from '../../../../core/notifications/toast.service';
import { UsersService } from '../../../../core/http/services/users.service';
import { AppwriteService } from '../../../../core/auth/services/appwrite.service';
import { UserDrawerComponent } from '../../components/user-drawer/user-drawer';
import { AppUser } from '../../models/user.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-user-list',
  imports: [TranslatePipe, NgIcon, EditableTableComponent, SearchBarComponent, UserDrawerComponent],
  templateUrl: './user-list.html',
})
export class UserListPage implements OnInit {
  private usersService = inject(UsersService);
  private toast        = inject(ToastService);
  private appwrite     = inject(AppwriteService);

  protected drawer = viewChild(UserDrawerComponent);

  protected allUsers   = signal<AppUser[]>([]);
  protected users      = signal<AppUser[]>([]);
  protected isLoading  = signal(true);
  protected drawerOpen = signal(false);
  protected editingUser = signal<AppUser | null>(null);
  protected searchQuery = signal('');

  protected readonly columns: EditableColumnDef<AppUser>[] = [
    { key: 'name',      header: 'USERS.NAME',       editable: true,  type: 'text',   sortable: true },
    { key: 'email',     header: 'USERS.EMAIL',       editable: false,                 sortable: true },
    { key: 'role',      header: 'USERS.ROLE',        editable: true,  type: 'select',
      options: [{ label: 'Admin', value: 'admin' }, { label: 'Usuario', value: 'user' }] },
    { key: 'status',    header: 'USERS.STATUS',      editable: false },
    { key: 'createdAt', header: 'USERS.CREATED_AT',  editable: false },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoading.set(true);
    this.usersService.getAll().subscribe({
      next: users => {
        this.allUsers.set(users);
        this.applyFilter(this.searchQuery());
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('USERS.LOAD_ERROR');
        this.isLoading.set(false);
      },
    });
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
    this.applyFilter(query);
  }

  private applyFilter(query: string): void {
    const q = query.toLowerCase().trim();
    this.users.set(
      q ? this.allUsers().filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      ) : [...this.allUsers()]
    );
  }

  protected openCreateDrawer(): void {
    this.editingUser.set(null);
    this.drawerOpen.set(true);
  }

  protected onDrawerSubmit(data: { name: string; email: string; role: string }): void {
    const drawerRef = this.drawer();
    if (!drawerRef) return;

    const editingUser = this.editingUser();
    drawerRef.setLoading(true);

    if (editingUser) {
      this.usersService.update(editingUser.id, { name: data.name, labels: [data.role] }).subscribe({
        next: updated => {
          this.allUsers.update(list => list.map(u => u.id === updated.id ? updated : u));
          this.applyFilter(this.searchQuery());
          this.closeDrawer();
          this.toast.success('USERS.UPDATED');
        },
        error: () => {
          drawerRef.setLoading(false);
          this.toast.error('USERS.UPDATE_ERROR');
        },
      });
    } else {
      this.usersService.create({ name: data.name, email: data.email, labels: [data.role] }).subscribe({
        next: created => {
          this.allUsers.update(list => [created, ...list]);
          this.applyFilter(this.searchQuery());
          this.closeDrawer();
          this.appwrite.sendPasswordRecovery(data.email, `${environment.appwrite.url}/reset-password`).catch(() => {});
          this.toast.success('USERS.CREATED');
        },
        error: () => {
          drawerRef.setLoading(false);
          this.toast.error('USERS.CREATE_ERROR');
        },
      });
    }
  }

  protected onTableSave(updatedRows: AppUser[]): void {
    const original = this.allUsers();
    const changed = updatedRows.filter(row => {
      const orig = original.find(u => u.id === row.id);
      return orig && (orig.name !== row.name || orig.role !== row.role);
    });

    if (!changed.length) return;

    let pending = changed.length;
    changed.forEach(row => {
      this.usersService.update(row.id, { name: row.name, labels: [row.role] }).subscribe({
        next: updated => {
          this.allUsers.update(list => list.map(u => u.id === updated.id ? updated : u));
          pending--;
          if (pending === 0) this.toast.success('USERS.UPDATED');
        },
        error: () => {
          pending--;
          this.toast.error('USERS.UPDATE_ERROR');
        },
      });
    });
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingUser.set(null);
    this.drawer()?.reset();
  }
}
