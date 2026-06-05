import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { User } from '@core/models';
import { initials } from '@shared/util/note-display';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <div class="page-head">
      <div>
        <div class="crumb">Admin</div>
        <h1>Users</h1>
        <p>{{ total() }} accounts</p>
      </div>
    </div>

    <div
      style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px;"
    >
      <div class="tabs" style="border:none;">
        <button class="tab" [attr.aria-selected]="role() === ''" (click)="setRole('')">All</button>
        <button class="tab" [attr.aria-selected]="role() === 'BUYER'" (click)="setRole('BUYER')">Buyers</button>
        <button class="tab" [attr.aria-selected]="role() === 'SELLER'" (click)="setRole('SELLER')">Sellers</button>
      </div>
      <div class="search" style="width:260px;">
        <span class="s-ic"
          ><svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.7" />
            <path d="m20 20-3.2-3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg></span
        ><input
          class="input"
          placeholder="Search by name or email"
          [value]="term()"
          (input)="term.set($any($event.target).value)"
        />
      </div>
    </div>

    @if (loading()) {
      <div class="skel" style="height:300px;border-radius:12px"></div>
    } @else {
      <div class="table-wrap responsive">
        <table class="tn">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th class="hide-mobile">Joined</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (u of filtered(); track u.id) {
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <span class="avatar avatar-sm">{{ initials(u.fullName) }}</span>
                    <div>
                      <div style="font-weight:700;">{{ u.fullName }}</div>
                      <div class="muted" style="font-size:13px;">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge" [class]="'badge ' + roleBadge(u.role)">{{ u.role }}</span>
                </td>
                <td>
                  <span class="badge" [class]="'badge ' + statusBadge(u.status)"
                    ><span class="dot"></span>{{ u.status }}</span
                  >
                </td>
                <td class="hide-mobile">{{ u.createdAt | date: 'd MMM y' }}</td>
                <td>
                  <div class="tbl-actions">
                    @if (u.status === 'ACTIVE') {
                      <button class="btn btn-ghost btn-sm" style="color:var(--danger);" (click)="suspend(u)">
                        Suspend
                      </button>
                    } @else if (u.status === 'SUSPENDED') {
                      <button class="btn btn-ghost btn-sm" style="color:var(--success);" (click)="activate(u)">
                        Activate
                      </button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="muted" style="text-align:center;padding:32px;">No users found.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class AdminUsersComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  protected users = signal<User[]>([]);
  protected total = signal(0);
  protected loading = signal(true);
  protected role = signal<'' | 'BUYER' | 'SELLER'>('');
  protected term = signal('');

  protected filtered = computed(() => {
    const q = this.term().trim().toLowerCase();
    if (!q) return this.users();
    return this.users().filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  });

  constructor() {
    this.load();
  }

  protected setRole(r: '' | 'BUYER' | 'SELLER') {
    this.role.set(r);
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.api
      .getUsers(this.role() || undefined, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.users.set(r.data?.content ?? []);
          this.total.set(r.data?.totalElements ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected suspend(u: User) {
    this.api
      .suspendUser(u.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success(`${u.fullName} suspended`);
          this.users.update((list) => list.map((x) => (x.id === u.id ? { ...x, status: 'SUSPENDED' } : x)));
        },
        error: () => {},
      });
  }
  protected activate(u: User) {
    this.api
      .activateUser(u.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success(`${u.fullName} activated`);
          this.users.update((list) => list.map((x) => (x.id === u.id ? { ...x, status: 'ACTIVE' } : x)));
        },
        error: () => {},
      });
  }

  protected readonly initials = initials;
  protected roleBadge(r: string): string {
    return r === 'SELLER' ? 'badge-amber' : r === 'ADMIN' ? 'badge-success' : 'badge-indigo';
  }
  protected statusBadge(s: string): string {
    return s === 'ACTIVE' ? 'badge-success' : 'badge-danger';
  }
}
