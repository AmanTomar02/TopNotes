import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { Purchase, SellerDashboard } from '@core/models';
import { AreaChartComponent } from '@ui/area-chart/area-chart.component';
import { initials, rupeeShort } from '@shared/util/note-display';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AreaChartComponent],
  template: `
    <div class="page-head">
      <div>
        <div class="crumb">Seller</div>
        <h1>Welcome back, {{ firstName() }}</h1>
        <p>Here's how your notes are performing.</p>
      </div>
      <div class="head-actions">
        <a class="btn btn-primary" routerLink="/seller/upload"
          ><svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          Upload new note</a
        >
      </div>
    </div>

    @if (loading()) {
      <div class="stat-grid">
        @for (s of [1, 2, 3, 4]; track s) {
          <div class="skel" style="height:108px;border-radius:12px"></div>
        }
      </div>
    } @else {
      @if (data(); as d) {
        @if (d.totalSales === 0 && d.totalNotes === 0) {
          <div class="card empty">
            <div class="e-ic">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <h3>No sales yet</h3>
            <p>Upload your first set of notes to start earning. Verified toppers earn on every download.</p>
            <a class="btn btn-primary" routerLink="/seller/upload">Upload your first note</a>
          </div>
        } @else {
          <div class="stat-grid">
            <div class="stat-card">
              <div class="s-top"><span class="s-label">Total earnings</span></div>
              <div class="s-value">₹{{ (d.totalEarnings || 0).toLocaleString('en-IN') }}</div>
            </div>
            <div class="stat-card">
              <div class="s-top"><span class="s-label">This month</span></div>
              <div class="s-value">₹{{ (d.monthEarnings || 0).toLocaleString('en-IN') }}</div>
            </div>
            <div class="stat-card">
              <div class="s-top"><span class="s-label">Notes sold</span></div>
              <div class="s-value">{{ d.totalSales || 0 }}</div>
            </div>
            <div class="stat-card">
              <div class="s-top"><span class="s-label">Avg. rating</span></div>
              <div class="s-value">{{ (d.averageRating || 0).toFixed(2) }}</div>
            </div>
          </div>

          <div class="dash-grid">
            <div class="card chart-card">
              <div class="chart-head"><h3>Revenue · last 30 days</h3></div>
              <app-area-chart [data]="chartData()" [labels]="chartLabels()" [fmt]="moneyFmt" />
            </div>
            <div>
              <div class="card card-pad" style="margin-bottom:16px;">
                <div
                  style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:var(--r-ctrl);"
                  [style.background]="d.isVerified ? 'var(--success-bg)' : 'var(--warning-bg)'"
                  [style.border]="'1px solid ' + (d.isVerified ? 'var(--success-line)' : 'var(--warning-line)')"
                >
                  <span [style.color]="d.isVerified ? 'var(--success)' : 'var(--warning)'"
                    ><svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2.5 4 6v5c0 5 3.5 8 8 9.5 4.5-1.5 8-4.5 8-9.5V6l-8-3.5Z"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linejoin="round"
                      />
                      <path
                        d="m9 12 2 2 4-4.5"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      /></svg
                  ></span>
                  <div style="line-height:1.3;">
                    <b style="font-size:13px;">{{ d.isVerified ? 'Verified Seller' : 'Verification pending' }}</b
                    ><br /><small style="font-size:12px;color:var(--slate);">{{
                      d.isVerified ? 'You can publish notes' : 'Complete verification to sell'
                    }}</small>
                  </div>
                </div>
                @if (!d.isVerified) {
                  <a class="quick-action" routerLink="/seller/verification" style="margin-top:14px;"
                    ><span class="qa-ic"
                      ><svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2.5 4 6v5c0 5 3.5 8 8 9.5 4.5-1.5 8-4.5 8-9.5V6l-8-3.5Z"
                          stroke="currentColor"
                          stroke-width="1.7"
                          stroke-linejoin="round"
                        /></svg></span
                    ><span><b>Complete verification</b><small>Test + marksheet</small></span></a
                  >
                }
                <a class="quick-action" routerLink="/seller/upload" style="margin-top:14px;"
                  ><span class="qa-ic"
                    ><svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      /></svg></span
                  ><span><b>Upload new note</b><small>Add to your catalogue</small></span></a
                >
                <a class="quick-action" routerLink="/seller/notes"
                  ><span class="qa-ic"
                    ><svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 3h9l5 5v13H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linejoin="round"
                      /></svg></span
                  ><span
                    ><b>Manage notes</b><small>{{ d.totalNotes }} published</small></span
                  ></a
                >
              </div>
            </div>
          </div>

          <div class="card card-pad" style="margin-top:20px;">
            <div class="chart-head"><h3>Recent sales</h3></div>
            <div class="sales-list">
              @for (s of sales(); track s.id) {
                <div class="sale-row">
                  <span class="avatar avatar-sm">{{ initials(s.note?.title) }}</span>
                  <div class="sr-body">
                    <div class="sr-note">{{ s.note?.title }}</div>
                    <div class="sr-meta">{{ s.invoiceNumber }}</div>
                  </div>
                  <span class="sr-amt">+₹{{ (s.sellerShare || s.amount || 0).toLocaleString('en-IN') }}</span>
                </div>
              } @empty {
                <p class="muted" style="font-size:14px;">No sales yet.</p>
              }
            </div>
          </div>
        }
      }
    }
  `,
})
export class SellerDashboardComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  protected data = signal<SellerDashboard | null>(null);
  protected sales = signal<Purchase[]>([]);
  protected loading = signal(true);

  protected firstName = computed(() => (this.auth.user()?.fullName ?? 'there').split(' ')[0]);
  protected chartData = computed(() => (this.data()?.salesChart ?? []).map((p) => p.revenue));
  protected chartLabels = computed(() => {
    const pts = this.data()?.salesChart ?? [];
    if (pts.length < 2) return [];
    const pick = [0, Math.floor(pts.length / 2), pts.length - 1];
    return pick.map((i) => (pts[i]?.date ?? '').slice(5));
  });
  protected moneyFmt = rupeeShort;

  constructor() {
    this.api
      .getSellerDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.data.set(r.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    this.api
      .getSellerSales(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => this.sales.set(r.data?.content ?? []),
        error: () => {},
      });
  }

  protected readonly initials = initials;
}
