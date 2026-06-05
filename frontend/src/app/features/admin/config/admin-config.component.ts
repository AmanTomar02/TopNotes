import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <div>
        <div class="crumb">Admin</div>
        <h1>Platform config</h1>
        <p>Global settings for the marketplace.</p>
      </div>
    </div>

    @if (loading()) {
      <div class="skel" style="height:240px;border-radius:12px;max-width:680px"></div>
    } @else {
      <div style="max-width:680px;">
        <div class="card card-pad" style="margin-bottom:20px;">
          <h3 style="font-size:var(--t-16);">Revenue split</h3>
          <p class="cr-help" style="margin-top:4px;">
            How sale revenue is divided between the platform and the seller. Always sums to 100%.
          </p>
          <div class="split-bar">
            <div class="sb-platform" [style.width.%]="platform()">{{ platform() }}%</div>
            <div class="sb-seller" [style.width.%]="100 - platform()">{{ 100 - platform() }}%</div>
          </div>
          <div style="display:flex;align-items:center;gap:14px;">
            <span style="display:inline-flex;align-items:center;gap:6px;font-size:13px;"
              ><span style="width:12px;height:12px;border-radius:3px;background:var(--indigo-700);"></span
              >Platform</span
            >
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              [value]="platform()"
              (input)="platform.set(+$any($event.target).value)"
              style="flex:1;accent-color:var(--indigo-700);"
            />
            <span style="display:inline-flex;align-items:center;gap:6px;font-size:13px;"
              ><span style="width:12px;height:12px;border-radius:3px;background:var(--amber);"></span>Seller</span
            >
          </div>
          <div style="margin-top:18px;">
            <button class="btn btn-primary" [attr.data-loading]="savingSplit() ? '1' : null" (click)="saveSplit()">
              <span class="btn-spin"></span><span>Save split</span>
            </button>
          </div>
        </div>

        <div class="card card-pad">
          <div class="config-row">
            <div>
              <div class="cr-label">Currency</div>
              <div class="cr-help">Display and payout currency.</div>
            </div>
            <div class="cr-control">
              <select class="select" [value]="currency()" (change)="currency.set($any($event.target).value)">
                <option value="INR">₹ INR — Indian Rupee</option>
                <option value="USD">$ USD — US Dollar</option>
              </select>
            </div>
          </div>
          <div class="config-row">
            <div>
              <div class="cr-label">Test pass score</div>
              <div class="cr-help">Minimum score sellers need on the academic test.</div>
            </div>
            <div class="cr-control">
              <div style="display:flex;align-items:center;gap:8px;">
                <input
                  class="input"
                  type="number"
                  [value]="passScore()"
                  (input)="passScore.set(+$any($event.target).value)"
                  style="width:90px;"
                /><span class="slate">%</span>
              </div>
            </div>
          </div>
          <div style="margin-top:18px;">
            <button class="btn btn-primary" [attr.data-loading]="savingOther() ? '1' : null" (click)="saveOther()">
              <span class="btn-spin"></span><span>Save changes</span>
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminConfigComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  protected loading = signal(true);
  protected platform = signal(35);
  protected currency = signal('INR');
  protected passScore = signal(70);
  protected savingSplit = signal(false);
  protected savingOther = signal(false);

  constructor() {
    this.api
      .getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          const c = r.data ?? {};
          this.platform.set(+(c['platform-commission-percent'] ?? 35));
          this.currency.set(c['currency'] ?? 'INR');
          this.passScore.set(+(c['test-pass-score-percent'] ?? 70));
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected saveSplit() {
    this.savingSplit.set(true);
    forkJoin([
      this.api.updateConfig('platform-commission-percent', String(this.platform())),
      this.api.updateConfig('seller-commission-percent', String(100 - this.platform())),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingSplit.set(false);
          this.toast.success('Revenue split updated');
        },
        error: () => this.savingSplit.set(false),
      });
  }

  protected saveOther() {
    this.savingOther.set(true);
    forkJoin([
      this.api.updateConfig('currency', this.currency()),
      this.api.updateConfig('test-pass-score-percent', String(this.passScore())),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingOther.set(false);
          this.toast.success('Settings saved');
        },
        error: () => this.savingOther.set(false),
      });
  }
}
