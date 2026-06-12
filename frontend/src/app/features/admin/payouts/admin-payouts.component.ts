import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { PayoutRow } from '@core/models';
import { IllustrationComponent } from '@ui/illustration/illustration.component';

@Component({
  selector: 'app-admin-payouts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, IllustrationComponent],
  template: `
    <div class="page-head">
      <div>
        <div class="crumb">Admin</div>
        <h1>Payouts</h1>
        <p>Disburse pending seller withdrawals to their UPI.</p>
      </div>
    </div>

    @if (loading()) {
      <div class="skel" style="height:240px;border-radius:12px"></div>
    } @else if (rows().length === 0) {
      <div class="card empty">
        <app-illustration name="sales" />
        <h3>No pending payouts</h3>
        <p>Seller withdrawal requests will show up here for you to pay out.</p>
      </div>
    } @else {
      <div class="table-wrap">
        <table class="tn">
          <thead>
            <tr>
              <th>Seller</th>
              <th>UPI</th>
              <th>Amount</th>
              <th class="hide-mobile">Requested</th>
              <th class="tbl-actions">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.id) {
              <tr>
                <td><b>{{ r.sellerName }}</b></td>
                <td class="muted" style="overflow-wrap:anywhere;">{{ r.upiId }}</td>
                <td><b>₹{{ r.amount.toLocaleString('en-IN') }}</b></td>
                <td class="muted hide-mobile">{{ r.requestedAt | date: 'd MMM y' }}</td>
                <td class="tbl-actions">
                  <button class="btn btn-primary btn-sm" [disabled]="paying() === r.id" (click)="pay(r)">
                    {{ paying() === r.id ? 'Paying…' : 'Pay' }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class AdminPayoutsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  protected rows = signal<PayoutRow[]>([]);
  protected loading = signal(true);
  protected paying = signal<number | null>(null);

  constructor() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.api
      .getPendingPayouts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.rows.set(r.data?.content ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected pay(r: PayoutRow) {
    if (this.paying()) return;
    this.paying.set(r.id);
    this.api
      .payPayout(r.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.paying.set(null);
          const p = res.data;
          if (p?.status === 'PAID') {
            this.toast.success('Paid ₹' + p.amount.toLocaleString('en-IN') + ' to ' + r.sellerName);
          } else {
            this.toast.error('Payout failed: ' + (p?.failureReason ?? 'unknown error'));
          }
          this.load();
        },
        error: () => this.paying.set(null),
      });
  }
}
