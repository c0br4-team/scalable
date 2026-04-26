import { ChangeDetectionStrategy, Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { DataTableComponent, ColumnDef, PaginatorConfig, PageEvent } from '../../../../shared/design-system/components/table';
import { SearchBarComponent } from '../../../../shared/design-system/components/search-bar/search-bar.component';
import { ToastService } from '../../../../core/services/toast.service';
import { UsersService } from '../../../../core/http/services/users.service';
import { AuthService } from '../../../../core/http/services/auth.service';
import { UserDrawerComponent } from '../../components/user-drawer/user-drawer';
import { AppUser } from '../../models/user.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-user-list',
  imports: [TranslatePipe, NgIcon, DataTableComponent, SearchBarComponent, UserDrawerComponent],
  templateUrl: './user-list.html',
  host: { class: 'flex min-h-0 flex-1 flex-col overflow-hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListPage implements OnInit {
  private usersService = inject(UsersService);
  private toast        = inject(ToastService);
  private router       = inject(Router);
  private auth         = inject(AuthService);

  protected drawer = viewChild(UserDrawerComponent);

  protected users       = signal<AppUser[]>([]);
  protected isLoading   = signal(true);
  protected drawerOpen  = signal(false);
  protected editingUser = signal<AppUser | null>(null);
  protected searchQuery = signal('');

  protected paginator = signal<PaginatorConfig>({
    page: 1, pageSize: 20, total: 0, pageSizeOptions: [10, 20, 50]
  });

  protected readonly columns: ColumnDef<AppUser>[] = [
    { key: 'name',      header: 'USERS.NAME',         sortable: true },
    { key: 'email',     header: 'USERS.EMAIL',        sortable: true },
    { key: 'role',      header: 'USERS.ROLE' },
    { key: 'otpStatus', header: 'USERS.OTP_STATUS' },
    { key: 'status',    header: 'USERS.STATUS' },
    { key: 'createdAt', header: 'USERS.CREATED_AT' },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoading.set(true);
    const { page, pageSize } = this.paginator();
    this.usersService.getAll(page, pageSize, this.searchQuery() || undefined).subscribe({
      next: result => {
        this.users.set(result.items);
        this.paginator.update(p => ({ ...p, total: result.totalCount, page: result.page, pageSize: result.pageSize }));
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
    this.paginator.update(p => ({ ...p, page: 1 }));
    this.loadUsers();
  }

  protected openCreateDrawer(): void {
    this.editingUser.set(null);
    this.drawerOpen.set(true);
  }

  protected onDrawerSubmit(data: { name: string; email: string; role: string; otpRequired: boolean }): void {
    const drawerRef = this.drawer();
    if (!drawerRef) return;

    const editingUser = this.editingUser();
    drawerRef.setLoading(true);

    if (editingUser) {
      this.usersService.update(editingUser.id, { name: data.name, labels: [data.role], otpRequired: data.otpRequired }).subscribe({
        next: updated => {
          this.syncCurrentSessionUser(updated);
          this.closeDrawer();
          this.loadUsers();
          this.toast.success('USERS.UPDATED');
        },
        error: () => {
          drawerRef.setLoading(false);
          this.toast.error('USERS.UPDATE_ERROR');
        },
      });
    } else {
      this.usersService.create({ name: data.name, email: data.email, labels: [data.role], otpRequired: data.otpRequired }).subscribe({
        next: () => {
          this.closeDrawer();
          this.paginator.update(p => ({ ...p, page: 1 }));
          this.loadUsers();
          this.toast.success('USERS.CREATED');

          this.auth.requestPasswordRecovery(data.email, `${environment.appwrite.url}reset-password`).subscribe({
            error: () => this.toast.warning('LOGIN.ERROR_NETWORK'),
          });
        },
        error: () => {
          drawerRef.setLoading(false);
          this.toast.error('USERS.CREATE_ERROR');
        },
      });
    }
  }

  protected onRowClick(user: AppUser): void {
    this.router.navigate(['/users', user.id], { state: { user } });
  }

  protected onPageChange(event: PageEvent): void {
    this.paginator.update(p => ({ ...p, page: event.page, pageSize: event.pageSize }));
    this.loadUsers();
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingUser.set(null);
    this.drawer()?.reset();
  }

  private syncCurrentSessionUser(updated: AppUser): void {
    const currentUser = this.auth.user();
    if (!currentUser || currentUser.id !== updated.id) return;

    this.auth.refreshCurrentUser().subscribe({
      error: () => undefined,
    });
  }
}
