import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { AdminDashboard, User } from '@core/models';
import { AreaChartComponent } from '@ui/area-chart/area-chart.component';
import { initials, rupeeShort } from '@shared/util/note-display';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AreaChartComponent],
  template: `
    <div class="page-head">
      <div>
        <div class="crumb">Admin</div>
        <h1>Platform overview</h1>
        <p>Monitor users, revenue and pending approvals.</p>
      </div>
    </div>

    @if (loading()) {
      <div class="stat-grid stat-grid-5">
        @for (s of [1, 2, 3, 4, 5]; track s) {
          <div class="skel" style="height:108px;border-radius:12px"></div>
        }
      </div>
    } @else {
      @if (data(); as d) {
        <div class="stat-grid stat-grid-5">
          <div class="stat-card">
            <div class="s-top"><span class="s-label">Total users</span></div>
            <div class="s-value">{{ d.totalUsers || 0 }}</div>
          </div>
          <div class="stat-card">
            <div class="s-top"><span class="s-label">Sellers</span></div>
            <div class="s-value">{{ d.totalSellers || 0 }}</div>
          </div>
          <div class="stat-card">
            <div class="s-top"><span class="s-label">Notes</span></div>
            <div class="s-value">{{ d.totalNotes || 0 }}</div>
          </div>
          <div class="stat-card">
            <div class="s-top"><span class="s-label">Revenue</span></div>
            <div class="s-value">₹{{ (d.totalRevenue || 0).toLocaleString('en-IN') }}</div>
          </div>
          <a
            routerLink="/admin/verifications"
            class="stat-card"
            style="background:var(--indigo-800);border-color:var(--indigo-800);color:#fff;text-decoration:none;"
          >
            <div class="s-top"><span class="s-label" style="color:rgba(255,255,255,.8);">Pending approvals</span></div>
            <div class="s-value" style="color:#fff;">{{ d.pendingSellerApprovals || 0 }}</div>
            <div class="s-delta" style="color:#fff;">Review now →</div>
          </a>
        </div>

        <div class="dash-grid">
          <div class="card chart-card">
            <div class="chart-head"><h3>Platform revenue · last 30 days</h3></div>
            <app-area-chart [data]="chartData()" [labels]="chartLabels()" [fmt]="moneyFmt" />
          </div>
          <div class="card card-pad">
            <div class="chart-head">
              <h3>Pending approvals</h3>
              <a class="link" routerLink="/admin/verifications">View all</a>
            </div>
            @for (p of pending(); track p.id) {
              <div class="sale-row">
                <span class="avatar avatar-sm">{{ initials(p.fullName) }}</span>
                <div class="sr-body">
                  <div class="sr-note">{{ p.fullName }}</div>
                  <div class="sr-meta">{{ p.institution }} · {{ p.testScore }}% test</div>
                </div>
                <a class="btn btn-secondary btn-sm" routerLink="/admin/verifications">Review</a>
              </div>
            } @empty {
              <p class="muted" style="font-size:14px;">No pending approvals 🎉</p>
            }
          </div>
        </div>
      }
    }
  `,
})
export class AdminDashboardComponent {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  protected data = signal<AdminDashboard | null>(null);
  protected pending = signal<User[]>([]);
  protected loading = signal(true);

  protected chartData = computed(() => (this.data()?.dailyRevenue ?? []).map((p) => p.revenue));
  protected chartLabels = computed(() => {
    const pts = this.data()?.dailyRevenue ?? [];
    if (pts.length < 2) return [];
    return [0, Math.floor(pts.length / 2), pts.length - 1].map((i) => (pts[i]?.date ?? '').slice(5));
  });
  protected moneyFmt = rupeeShort;

  constructor() {
    this.api
      .getAdminDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.data.set(r.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    this.api
      .getPendingVerifications(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => this.pending.set((r.data?.content ?? []).slice(0, 4)),
        error: () => {},
      });
  }

  protected readonly initials = initials;
}
