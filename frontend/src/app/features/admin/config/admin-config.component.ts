import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
<app-navbar></app-navbar>
<div class="page-shell">
<div class="container page-body" style="max-width:860px">

  <div class="sh"><h2 class="st">Platform Configuration</h2></div>

  <!-- Revenue split card -->
  <div class="cfg-card">
    <div class="cfg-left">
      <h3>Revenue Split</h3>
      <p>Configure how revenue is distributed between the platform and sellers. Changes take effect immediately — no server restart required.</p>
      <div class="split-summary">
        <div class="split-label">
          <span>Platform</span><strong>{{ platformPct }}%</strong>
        </div>
        <div class="split-bar">
          <div class="split-fill" [style.width.%]="platformPct"></div>
        </div>
        <div class="split-label">
          <span>Seller</span><strong>{{ 100 - platformPct }}%</strong>
        </div>
      </div>
    </div>
    <div class="cfg-right">
      <div class="fg">
        <label class="fl">Platform Commission (%)</label>
        <input class="fc" type="number" [(ngModel)]="platformPct" min="1" max="99" (ngModelChange)="onCommissionChange()">
        <small style="font-size:.73rem;color:var(--mu);margin-top:.25rem;display:block">Seller gets {{ 100 - platformPct }}%</small>
      </div>
      <button class="btn btn-primary" (click)="saveCommission()" [disabled]="saving()">
        {{ saving() ? 'Saving…' : 'Save Changes' }}
      </button>
      @if (savedMsg()) { <div class="alert alert-success" style="margin-top:.6rem;margin-bottom:0">{{ savedMsg() }}</div> }
    </div>
  </div>

  <!-- Other settings -->
  <div class="cfg-card" style="margin-top:1.25rem">
    <div style="grid-column:span 2">
      <h3 style="margin-bottom:1.1rem">Other Platform Settings</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 1.5rem">
        @for (item of otherConfigs; track item.key) {
          <div class="fg">
            <label class="fl">{{ item.label }}</label>
            <input class="fc" [(ngModel)]="item.value" [type]="item.type || 'text'" [placeholder]="item.placeholder || ''">
            @if (item.hint) { <small style="font-size:.73rem;color:var(--mu);margin-top:.2rem;display:block">{{ item.hint }}</small> }
          </div>
        }
      </div>
      <button class="btn btn-outline btn-sm" (click)="saveOtherConfigs()" [disabled]="saving()">Save All Settings</button>
    </div>
  </div>

  <!-- Config table -->
  <div style="margin-top:1.25rem">
    <h3 style="font-size:1rem;margin-bottom:1rem">All Configuration Keys</h3>
    <div class="tw">
      <table>
        <thead><tr><th>Key</th><th>Value</th></tr></thead>
        <tbody>
          @for (entry of configEntries(); track entry.key) {
            <tr>
              <td><code style="font-size:.8rem;background:var(--cr2);padding:.15rem .4rem;border-radius:4px">{{ entry.key }}</code></td>
              <td style="font-weight:600">{{ entry.value }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>

</div>
</div>
  `,
  styles: [`
    .cfg-card { background:#fff; border-radius:20px; padding:1.75rem; box-shadow:var(--sh); display:grid; grid-template-columns:1fr 1fr; gap:2rem; }
    .cfg-left h3 { margin-bottom:.45rem; font-size:1.1rem; }
    .cfg-left p  { color:var(--mu); font-size:.84rem; line-height:1.65; margin-bottom:1.25rem; }
    .split-summary { background:var(--cr2); border-radius:12px; padding:1rem; }
    .split-label { display:flex; justify-content:space-between; font-size:.84rem; margin-bottom:.45rem; }
    .split-label strong { font-weight:700; }
    .split-bar { height:10px; background:var(--cr3); border-radius:5px; overflow:hidden; }
    .split-fill { height:100%; background:linear-gradient(90deg, var(--ink), var(--ink2)); border-radius:5px; transition:width .3s ease; }
    @media(max-width:700px) { .cfg-card { grid-template-columns:1fr; } }
  `]
})
export class AdminConfigComponent implements OnInit {
  platformPct  = 35;
  saving       = signal(false);
  savedMsg     = signal('');
  configEntries= signal<{ key: string; value: string }[]>([]);

  otherConfigs = [
    { key: 'test-pass-score-percent', label: 'Test Pass Score (%)',  value: '70',  type: 'number', hint: 'Minimum % to pass seller test', placeholder: '70' },
    { key: 'currency',                label: 'Currency',             value: 'INR', type: 'text',   hint: 'Display currency symbol',        placeholder: 'INR' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getConfig().subscribe(r => {
      if (r.success) {
        const cfg = r.data;
        if (cfg['platform-commission-percent']) {
          this.platformPct = +cfg['platform-commission-percent'];
        }
        // Populate otherConfigs values from DB
        this.otherConfigs.forEach(item => {
          if (cfg[item.key]) item.value = cfg[item.key];
        });
        // Build display table
        this.configEntries.set(Object.entries(cfg).map(([key, value]) => ({ key, value })));
      }
    });
  }

  onCommissionChange() {
    this.platformPct = Math.max(1, Math.min(99, this.platformPct));
  }

  saveCommission() {
    this.saving.set(true); this.savedMsg.set('');
    this.api.updateConfig('platform-commission-percent', String(this.platformPct)).subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          this.savedMsg.set('Commission updated successfully!');
          this.ngOnInit(); // Refresh table
          setTimeout(() => this.savedMsg.set(''), 3000);
        }
      },
      error: () => this.saving.set(false)
    });
  }

  saveOtherConfigs() {
    this.saving.set(true);
    let pending = this.otherConfigs.length;
    this.otherConfigs.forEach(item => {
      this.api.updateConfig(item.key, item.value).subscribe(() => {
        pending--;
        if (pending === 0) { this.saving.set(false); this.ngOnInit(); }
      });
    });
  }
}
