import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-verifications',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
<app-navbar></app-navbar>
<div class="page-shell">
<div class="container page-body">
  <div class="sh">
    <h2 class="st">Seller Verifications</h2>
    <span class="badge badge-gd">{{ totalElements() }} pending</span>
  </div>

  @if (loading()) { <div class="sw"><div class="sp"></div></div> }
  @else if (sellers().length === 0) {
    <div class="es">
      <div class="icon">✅</div>
      <h3>All caught up!</h3>
      <p>No pending seller verifications.</p>
    </div>
  } @else {
    <div style="display:flex;flex-direction:column;gap:1.25rem">
      @for (s of sellers(); track s.id) {
        <div class="vc">
          <!-- Header -->
          <div class="vc-head">
            <div class="vc-av">{{ s.fullName?.charAt(0) }}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:1rem">{{ s.fullName }}</div>
              <div style="font-size:.8rem;color:var(--mu)">{{ s.email }}</div>
              @if (s.classLevel) { <div style="font-size:.78rem;color:var(--mu)">{{ s.classLevel }}</div> }
            </div>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">
              @if (s.testPassed) { <span class="badge badge-gn">✓ Test: {{ s.testScore }}%</span> }
              @if (s.marksheetApproved === false && s.testPassed) { <span class="badge badge-gd">📄 Marksheet Uploaded</span> }
            </div>
          </div>

          <!-- Marksheet preview (blurred for privacy) -->
          @if (s.testPassed) {
            <div class="ms-preview">
              <div class="ms-label">Marksheet Preview <span style="font-weight:400;color:var(--mu)">(privacy blur applied — only Name & Roll visible to admin)</span></div>
              <div class="ms-blur-wrap">
                <div class="ms-visible top"></div>
                <div class="ms-blurred"></div>
                <div class="ms-visible bottom"></div>
                <div class="ms-lock">🔒 Privacy Protected</div>
              </div>
              <a [href]="apiUrl + '/uploads' + '/marksheets'" target="_blank" class="btn btn-outline btn-sm" style="margin-top:.5rem">View Full Document</a>
            </div>
          }

          <!-- Actions -->
          <div class="vc-actions">
            <input class="fc" style="flex:1;min-width:200px" [(ngModel)]="reasons[s.id]"
                   placeholder="Rejection reason (required if rejecting)">
            <button class="btn btn-teal" (click)="approve(s, true)">✓ Approve</button>
            <button class="btn btn-danger" (click)="approve(s, false)">✕ Reject</button>
          </div>
        </div>
      }
    </div>
  }

  <!-- Toast -->
  @if (toast()) {
    <div class="toast-fixed">
      <div class="toast" [class.ok]="toastType()==='ok'" [class.er]="toastType()==='er'">{{ toast() }}</div>
    </div>
  }
</div>
</div>
  `,
  styles: [`
    .vc { background:#fff; border-radius:20px; padding:1.5rem; box-shadow:var(--sh); }
    .vc-head { display:flex; align-items:flex-start; gap:.9rem; flex-wrap:wrap; margin-bottom:1.1rem; }
    .vc-av   { width:48px; height:48px; border-radius:50%; background:var(--ink); color:var(--gd); display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:700; flex-shrink:0; }
    .ms-preview { margin-bottom:1.1rem; }
    .ms-label { font-size:.78rem; font-weight:700; color:var(--mu); margin-bottom:.5rem; text-transform:uppercase; letter-spacing:.05em; }
    .ms-blur-wrap { position:relative; border-radius:10px; overflow:hidden; background:var(--cr2); height:100px; display:flex; flex-direction:column; }
    .ms-visible  { background:transparent; height:20%; }
    .ms-blurred  { flex:1; backdrop-filter:blur(14px); background:rgba(255,255,255,.35); }
    .ms-lock { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:1.5rem; color:rgba(0,0,0,.3); }
    .vc-actions { display:flex; gap:.6rem; align-items:center; flex-wrap:wrap; }
    .toast-fixed { position:fixed; bottom:2rem; right:2rem; z-index:9999; animation:fi .2s ease; }
    .toast { background:var(--ink); color:#fff; padding:.75rem 1.4rem; border-radius:14px; box-shadow:var(--shl); font-size:.88rem; font-weight:500; }
    .toast.ok { background:var(--gn); } .toast.er { background:var(--rd); }
  `]
})
export class AdminVerificationsComponent implements OnInit {
  sellers      = signal<User[]>([]);
  loading      = signal(true);
  totalElements= signal(0);
  reasons: Record<number, string> = {};
  toast      = signal('');
  toastType  = signal('');
  apiUrl     = environment.apiUrl;

  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }

  load() {
    this.api.getPendingVerifications().subscribe(r => {
      this.loading.set(false);
      if (r.success) { this.sellers.set(r.data.content); this.totalElements.set(r.data.totalElements); }
    });
  }

  approve(s: User, approved: boolean) {
    if (!approved && !this.reasons[s.id]?.trim()) {
      alert('Please provide a rejection reason.'); return;
    }
    this.api.approveSeller(s.id, approved, this.reasons[s.id]).subscribe(r => {
      if (r.success) {
        this.sellers.update(list => list.filter(x => x.id !== s.id));
        this.totalElements.update(n => n - 1);
        this.showToast(approved ? '✅ Seller approved and notified!' : '✕ Seller rejected and notified.', approved ? 'ok' : 'er');
      }
    });
  }

  showToast(msg: string, type: string) {
    this.toast.set(msg); this.toastType.set(type);
    setTimeout(() => this.toast.set(''), 3200);
  }
}
