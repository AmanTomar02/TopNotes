import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ApiService } from '@core/services/api.service';
import { User } from '@core/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, DatePipe],
  template: `
<app-navbar></app-navbar>
<div class="page-shell">
<div class="container page-body">
  <div class="sh"><h2 class="st">User Management</h2></div>

  <!-- Role tabs -->
  <div class="role-tabs">
    @for (t of tabs; track t.val) {
      <button class="rtab" [class.active]="roleFilter === t.val" (click)="setRole(t.val)">{{ t.label }}</button>
    }
  </div>

  @if (loading()) { <div class="sw"><div class="sp"></div></div> }
  @else {
    <div class="tw">
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Verified</th><th>Joined</th><th>Actions</th></tr>
        </thead>
        <tbody>
          @for (u of users(); track u.id) {
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:.55rem">
                  <div style="width:28px;height:28px;border-radius:50%;background:var(--ink);color:var(--gd);display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0">{{ u.fullName.charAt(0) }}</div>
                  {{ u.fullName }}
                </div>
              </td>
              <td>{{ u.email }}</td>
              <td><span class="badge" [class]="roleBadge(u.role)">{{ u.role }}</span></td>
              <td><span class="badge" [class]="statusBadge(u.status)">{{ u.status }}</span></td>
              <td>
                @if (u.role === 'SELLER') {
                  <span class="badge" [class]="u.isVerified ? 'badge-gn' : 'badge-rd'">{{ u.isVerified ? '✓ Yes' : '✗ No' }}</span>
                } @else { <span style="color:var(--mu)">—</span> }
              </td>
              <td>{{ u.createdAt | date:'mediumDate' }}</td>
              <td>
                @if (u.status === 'ACTIVE') {
                  <button class="btn btn-danger btn-sm" (click)="suspend(u)">Suspend</button>
                } @else if (u.status === 'SUSPENDED') {
                  <button class="btn btn-teal btn-sm" (click)="activate(u)">Activate</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (totalPages() > 1) {
      <div class="pgn">
        <button class="pb" (click)="go(page()-1)" [disabled]="page()===0">‹</button>
        @for (i of pageArr(); track i) { <button class="pb" [class.active]="i===page()" (click)="go(i)">{{ i+1 }}</button> }
        <button class="pb" (click)="go(page()+1)" [disabled]="page()>=totalPages()-1">›</button>
      </div>
    }
  }
</div>
</div>
  `,
  styles: [`
    .role-tabs { display:flex; gap:.4rem; margin-bottom:1.25rem; flex-wrap:wrap; }
    .rtab { padding:.38rem 1rem; border:1.5px solid var(--cr3); border-radius:100px; background:#fff; font-family:'Outfit',sans-serif; font-size:.84rem; cursor:pointer; color:var(--mu); transition:all var(--t); }
    .rtab.active { background:var(--ink); color:#fff; border-color:var(--ink); }
  `]
})
export class AdminUsersComponent implements OnInit {
  users      = signal<User[]>([]);
  loading    = signal(true);
  page       = signal(0);
  totalPages = signal(0);
  roleFilter = '';
  tabs = [
    { val: '',       label: 'All Users' },
    { val: 'BUYER',  label: 'Buyers'    },
    { val: 'SELLER', label: 'Sellers'   },
    { val: 'ADMIN',  label: 'Admins'    },
  ];

  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }

  load(p = 0) {
    this.loading.set(true); this.page.set(p);
    this.api.getUsers(this.roleFilter || undefined, p).subscribe(r => {
      this.loading.set(false);
      if (r.success) { this.users.set(r.data.content); this.totalPages.set(r.data.totalPages); }
    });
  }

  setRole(r: string) { this.roleFilter = r; this.load(0); }
  go(p: number) { if (p < 0 || p >= this.totalPages()) return; this.load(p); }
  pageArr() { return Array.from({ length: this.totalPages() }, (_, i) => i); }

  suspend(u: User) {
    if (!confirm(`Suspend ${u.fullName}?`)) return;
    this.api.suspendUser(u.id).subscribe(r => { if (r.success) u.status = 'SUSPENDED' as any; });
  }
  activate(u: User) {
    this.api.activateUser(u.id).subscribe(r => { if (r.success) u.status = 'ACTIVE' as any; });
  }

  roleBadge(r: string)   { return r==='ADMIN'?'badge-ik':r==='SELLER'?'badge-gd':'badge-tl'; }
  statusBadge(s: string) { return s==='ACTIVE'?'badge-gn':'badge-rd'; }
}
