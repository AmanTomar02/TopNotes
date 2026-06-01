import { Component, OnInit, AfterViewInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SellerDashboard, Note } from '../../../core/models';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
<app-navbar></app-navbar>
<div class="page-shell">
<div class="container page-body">

  <div class="sh">
    <div>
      <h2 style="font-size:1.5rem">Welcome back, {{ auth.user()?.fullName?.split(' ')?.[0] || 'Seller' }} 👋</h2>
      <p style="color:var(--mu);font-size:.85rem;margin-top:.2rem">Your earnings and performance at a glance</p>
    </div>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap">
      <a routerLink="/seller/verification" class="btn btn-outline btn-sm">Verification Status</a>
      <a routerLink="/seller/upload"       class="btn btn-primary btn-sm">+ Upload Notes</a>
    </div>
  </div>

  @if (loading()) { <div class="sw"><div class="sp"></div></div> }
  @else if (data()) {

    <!-- Verification banner -->
    @if (!data()!.isVerified) {
      <div class="vbanner">
        <span style="font-size:1.75rem">⚠️</span>
        <div style="flex:1">
          <strong style="display:block;margin-bottom:.2rem">Complete verification to start selling</strong>
          <p style="font-size:.82rem;color:var(--mu)">Pass the academic test and upload your marksheet to get verified.</p>
        </div>
        <a routerLink="/seller/verification" class="btn btn-gold btn-sm">Start Verification →</a>
      </div>
    }

    <!-- Stats -->
    <div class="sg" style="margin-bottom:1.5rem">
      <div class="sc gd"><div class="sl">Total Earnings</div><div class="sv">₹{{ (data()!.totalEarnings||0) | number:'1.0-0' }}</div><div class="ss">All time</div></div>
      <div class="sc tl"><div class="sl">This Month</div><div class="sv">₹{{ (data()!.monthEarnings||0) | number:'1.0-0' }}</div></div>
      <div class="sc ik"><div class="sl">Today</div><div class="sv">₹{{ (data()!.todayEarnings||0) | number:'1.0-0' }}</div></div>
      <div class="sc gn"><div class="sl">Total Notes</div><div class="sv">{{ data()!.totalNotes || 0 }}</div></div>
      <div class="sc gd"><div class="sl">Total Sales</div><div class="sv">{{ data()!.totalSales || 0 }}</div></div>
      <div class="sc tl"><div class="sl">Avg Rating</div><div class="sv">{{ (data()!.averageRating||0).toFixed(1) }}★</div></div>
    </div>

    <!-- Chart -->
    <div class="chart-card" style="margin-bottom:1.5rem">
      <div style="font-size:.88rem;font-weight:700;color:var(--ink3);margin-bottom:1.1rem">Revenue — Last 30 Days</div>
      <div style="height:200px;position:relative">
        <canvas #chartRef></canvas>
      </div>
    </div>

    <!-- Recent notes -->
    @if (data()!.recentNotes?.length) {
      <div class="sh">
        <h3 class="st" style="font-size:1.2rem">Recent Notes</h3>
        <a routerLink="/seller/notes" class="btn btn-outline btn-sm">View All →</a>
      </div>
      <div class="ng">
        @for (n of data()!.recentNotes; track n.id) {
          <div class="nc" [routerLink]="['/notes', n.id]">
            <div class="ni" style="background:#1e1c2e">
              <div class="icon">📄</div>
              <div class="sub">{{ n.subject }}</div>
            </div>
            <div class="nb2">
              <div class="nt">{{ n.title }}</div>
              <div class="nf">
                <div class="np">₹{{ n.price }}</div>
                <div class="nr">🛒 {{ n.purchaseCount }} sold</div>
              </div>
            </div>
          </div>
        }
      </div>
    }
  }
</div>
</div>
  `,
  styles: [`
    .chart-card { background:#fff; border-radius:18px; padding:1.4rem; box-shadow:var(--sh); }
    .vbanner { display:flex; align-items:center; gap:1rem; background:linear-gradient(135deg,#fffaeb,#fff6d0); border:1.5px solid #f0d98a; border-radius:18px; padding:1.25rem 1.5rem; margin-bottom:1.5rem; flex-wrap:wrap; }
  `]
})
export class SellerDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('chartRef') chartRef!: ElementRef<HTMLCanvasElement>;
  data    = signal<SellerDashboard | null>(null);
  loading = signal(true);
  private chartBuilt = false;

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.getSellerDashboard().subscribe(r => {
      this.loading.set(false);
      if (r.success) this.data.set(r.data);
    });
  }

  ngAfterViewInit() {
    const interval = setInterval(() => {
      if (this.data() && this.chartRef && !this.chartBuilt) {
        this.chartBuilt = true;
        clearInterval(interval);
        this.buildChart();
      }
    }, 80);
  }

  private buildChart() {
    import('chart.js/auto').then(({ default: Chart }) => {
      const pts = this.data()?.salesChart || [];
      const labels = pts.map((d: any) => d.date?.slice(5) || d.month || '');
      const values = pts.map((d: any) => Number(d.revenue) || 0);
      new Chart(this.chartRef.nativeElement, {
        type: 'line',
        data: { labels, datasets: [{ label:'Revenue (₹)', data: values, borderColor:'#1e6b6b', backgroundColor:'rgba(30,107,107,.08)', borderWidth:2, pointRadius:3, fill:true, tension:0.4 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}, ticks:{font:{size:10}}}, y:{grid:{color:'#f2efe8'}, ticks:{callback: (v:any) => '₹'+v, font:{size:10}}} } }
      });
    });
  }
}
