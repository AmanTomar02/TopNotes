import { Component, OnInit, AfterViewInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ApiService } from '@core/services/api.service';
import { AdminDashboard } from '@core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
<app-navbar></app-navbar>
<div class="page-shell">
<div class="container page-body">

  <div class="sh">
    <div>
      <h2 style="font-size:1.5rem">Platform Overview</h2>
      <p style="color:var(--mu);font-size:.85rem;margin-top:.2rem">Real-time revenue and activity metrics</p>
    </div>
    @if (data()?.pendingSellerApprovals) {
      <a routerLink="/admin/verifications" class="btn btn-gold btn-sm">
        <span style="width:8px;height:8px;border-radius:50%;background:var(--rd);display:inline-block;animation:pulse 1s ease infinite"></span>
        {{ data()!.pendingSellerApprovals }} Pending Approvals
      </a>
    }
  </div>

  @if (loading()) { <div class="sw"><div class="sp"></div></div> }
  @else if (data()) {

    <!-- Revenue stats -->
    <div class="sg" style="margin-bottom:.9rem">
      <div class="sc gd"><div class="sl">Today's Revenue</div><div class="sv">₹{{ (data()!.todayRevenue||0)|number:'1.0-0' }}</div></div>
      <div class="sc tl"><div class="sl">Monthly Revenue</div><div class="sv">₹{{ (data()!.monthRevenue||0)|number:'1.0-0' }}</div></div>
      <div class="sc ik"><div class="sl">Platform Cut (yr)</div><div class="sv">₹{{ (data()!.platformRevenue||0)|number:'1.0-0' }}</div></div>
      <div class="sc gn"><div class="sl">Total Purchases</div><div class="sv">{{ data()!.totalPurchases|number }}</div></div>
    </div>

    <!-- User stats -->
    <div class="sg" style="margin-bottom:1.5rem">
      <div class="sc gd"><div class="sl">Total Users</div><div class="sv">{{ data()!.totalUsers|number }}</div></div>
      <div class="sc tl"><div class="sl">Sellers</div><div class="sv">{{ data()!.totalSellers|number }}</div></div>
      <div class="sc ik"><div class="sl">Buyers</div><div class="sv">{{ data()!.totalBuyers|number }}</div></div>
      <div class="sc gn"><div class="sl">Active Notes</div><div class="sv">{{ data()!.totalNotes|number }}</div></div>
    </div>

    <!-- Charts row -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="ch-title">Daily Revenue (30 days)</div>
        <div style="height:200px"><canvas #dailyRef></canvas></div>
      </div>
      <div class="chart-card">
        <div class="ch-title">Monthly Revenue (this year)</div>
        <div style="height:200px"><canvas #monthlyRef></canvas></div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="qa-grid">
      <a routerLink="/admin/verifications" class="qa-card">
        <div class="qa-icon">✅</div>
        <div class="qa-label">Verifications</div>
        <div class="qa-sub" [style.color]="data()!.pendingSellerApprovals ? 'var(--rd)' : 'var(--mu)'">
          {{ data()!.pendingSellerApprovals ? data()!.pendingSellerApprovals + ' pending review' : 'All caught up' }}
        </div>
      </a>
      <a routerLink="/admin/users" class="qa-card">
        <div class="qa-icon">👥</div>
        <div class="qa-label">Manage Users</div>
        <div class="qa-sub">{{ data()!.totalUsers | number }} total users</div>
      </a>
      <a routerLink="/admin/test" class="qa-card">
        <div class="qa-icon">📝</div>
        <div class="qa-label">Test Manager</div>
        <div class="qa-sub">Configure verification test</div>
      </a>
      <a routerLink="/admin/config" class="qa-card">
        <div class="qa-icon">⚙️</div>
        <div class="qa-label">Platform Config</div>
        <div class="qa-sub">Commission & settings</div>
      </a>
    </div>
  }

</div>
</div>
  `,
  styles: [`
    .charts-row  { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1.5rem; }
    .chart-card  { background:#fff; border-radius:18px; padding:1.4rem; box-shadow:var(--sh); }
    .ch-title    { font-size:.85rem; font-weight:700; color:var(--ink3); margin-bottom:1rem; }
    .qa-grid     { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; }
    .qa-card     { background:#fff; border-radius:18px; padding:1.3rem; box-shadow:var(--sh); cursor:pointer; transition:all var(--t); display:block; }
    .qa-card:hover { transform:translateY(-3px); box-shadow:var(--shl); }
    .qa-icon     { font-size:1.7rem; margin-bottom:.55rem; }
    .qa-label    { font-weight:700; font-size:.92rem; margin-bottom:.2rem; }
    .qa-sub      { font-size:.78rem; color:var(--mu); }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.3)} }
    @media(max-width:880px) { .charts-row,.qa-grid { grid-template-columns:1fr 1fr; } }
    @media(max-width:540px) { .charts-row,.qa-grid { grid-template-columns:1fr; } }
  `]
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('dailyRef')   dailyRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyRef') monthlyRef!: ElementRef<HTMLCanvasElement>;
  data    = signal<AdminDashboard | null>(null);
  loading = signal(true);
  private built = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getAdminDashboard().subscribe(r => {
      this.loading.set(false);
      if (r.success) this.data.set(r.data);
    });
  }

  ngAfterViewInit() {
    const iv = setInterval(() => {
      if (this.data() && this.dailyRef && !this.built) {
        this.built = true; clearInterval(iv); this.buildCharts();
      }
    }, 80);
  }

  private buildCharts() {
    import('chart.js/auto').then(({ default: Chart }) => {
      const d = this.data()!;

      // Daily bar chart
      const dLabels = (d.dailyRevenue || []).map((r: any) => r.date?.slice(5) || '');
      const dVals   = (d.dailyRevenue || []).map((r: any) => Number(r.revenue) || 0);
      new Chart(this.dailyRef.nativeElement, {
        type: 'bar',
        data: { labels: dLabels, datasets: [{ label:'₹', data: dVals, backgroundColor:'rgba(30,107,107,.7)', borderRadius:4 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false},ticks:{font:{size:10}}}, y:{grid:{color:'#f2efe8'},ticks:{callback:(v:any)=>'₹'+v,font:{size:10}}} } }
      });

      // Monthly line chart
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const mLabels = (d.monthlyRevenue || []).map((r: any) => months[(+r.month||1)-1]);
      const mVals   = (d.monthlyRevenue || []).map((r: any) => Number(r.revenue) || 0);
      new Chart(this.monthlyRef.nativeElement, {
        type: 'line',
        data: { labels: mLabels, datasets: [{ label:'Revenue', data: mVals, borderColor:'#c9a84c', backgroundColor:'rgba(201,168,76,.1)', borderWidth:2, fill:true, tension:0.4, pointRadius:3 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:'#f2efe8'},ticks:{callback:(v:any)=>'₹'+v}} } }
      });
    });
  }
}
