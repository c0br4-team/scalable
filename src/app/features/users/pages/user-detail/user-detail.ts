import {
  ChangeDetectionStrategy, Component, OnInit,
  inject, signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { UsersService } from '../../../../core/http/services/users.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AppUser } from '../../models/user.model';
import { LanguageService } from '../../../../core/services/language.service';
import { ConfirmDialogComponent } from '../../../../shared/design-system/components/confirm-dialog/confirm-dialog.component';
import { DatePipe } from '@angular/common';
import { CatalogService } from '../../../../core/http/services/catalog.service';
import { AuthService } from '../../../../core/http/services/auth.service';
import { DropdownComponent } from '../../../../shared/design-system/components/dropdown/dropdown.component';
import { DropdownConfig, DropdownOption } from '../../../../shared/design-system/models/components.model';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, NgIcon, ConfirmDialogComponent, DatePipe, DropdownComponent],
  templateUrl: './user-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailPage implements OnInit {
    public lang = inject(LanguageService);
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private fb           = inject(FormBuilder);
  private usersService = inject(UsersService);
  private toast        = inject(ToastService);
  private catalogs     = inject(CatalogService);
  private auth         = inject(AuthService);
  private readonly roleCatalogId = 1;

  protected user        = signal<AppUser | null>(null);
  protected isLoading   = signal(true);
  protected isSaving    = signal(false);
  protected isDirty     = signal(false);
  protected showConfirm = signal(false);

  protected readonly roleOptions = signal<DropdownOption[]>([]);
  protected readonly roleConfig: DropdownConfig = {
    searchFn: this.catalogs.createSearchFn(this.roleCatalogId, 20),
    debounceMs: 250,
    minChars: 0,
  };

  protected form = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(128)]],
    role:        ['user', Validators.required],
    isActive:    [true],
    otpRequired: [false],
  });

  ngOnInit(): void {
    this.loadRoleOptions();

    const id = this.route.snapshot.paramMap.get('id');

    // Angular sets navigation state in history.state
    const navState = history.state as { user?: AppUser };
    if (navState?.user?.id === id) {
      this.initUser(navState.user);
      this.isLoading.set(false);
    } else {
      this.usersService.getAll(1, 200).subscribe({
        next: result => {
          const found = result.items.find(u => u.id === id);
          if (found) {
            this.initUser(found);
          } else {
            this.toast.error('USERS.LOAD_ERROR');
            this.router.navigate(['/users']);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.toast.error('USERS.LOAD_ERROR');
          this.isLoading.set(false);
          this.router.navigate(['/users']);
        },
      });
    }

    this.form.valueChanges.subscribe(() => {
      this.isDirty.set(this.form.dirty);
    });
  }

  private loadRoleOptions(): void {
    this.catalogs.query(this.roleCatalogId, '', 20).subscribe({
      next: items => this.roleOptions.set(items.map(item => ({ label: item.value, value: item.key }))),
      error: () => this.roleOptions.set([]),
    });
  }

  private initUser(user: AppUser): void {
    // Solo para mostrar, convertimos createdAt a Date, pero mantenemos el tipo original en el modelo
    const normalizedUser = {
      ...user,
      createdAt: user.createdAt ? new Date(user.createdAt) : undefined
    } as AppUser & { createdAt: Date };
    this.user.set(normalizedUser);
    this.form.patchValue(
      {
        name: normalizedUser.name,
        role: normalizedUser.role,
        isActive: normalizedUser.isActive,
        otpRequired: normalizedUser.otpEnabled,
      },
      { emitEvent: false },
    );
    this.form.markAsPristine();
    this.isDirty.set(false);
  }

  protected onSaveClick(): void {
    if (this.form.invalid || !this.isDirty()) return;
    this.showConfirm.set(true);
  }

  protected onConfirmed(): void {
    this.showConfirm.set(false);
    const user = this.user();
    if (!user) return;

    const { name, role, isActive, otpRequired } = this.form.value;
    this.isSaving.set(true);

    this.usersService.update(user.id, {
      name: name!,
      labels: [role!],
      isActive: !!isActive,
      otpRequired: !!otpRequired,
    }).subscribe({
      next: updated => {
        this.syncCurrentSessionUser(updated);
        this.initUser(updated);
        this.isSaving.set(false);
        this.toast.success('USERS.UPDATED');
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.error('USERS.UPDATE_ERROR');
      },
    });
  }

  protected onCancelled(): void {
    this.showConfirm.set(false);
  }

  protected goBack(): void {
    this.router.navigate(['/users']);
  }

  private syncCurrentSessionUser(updated: AppUser): void {
    const currentUser = this.auth.user();
    if (!currentUser || currentUser.id !== updated.id) return;

    this.auth.refreshCurrentUser().subscribe({
      error: () => undefined,
    });
  }
}
