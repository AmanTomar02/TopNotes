import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ApiService } from '../../../core/services/api.service';
import { Purchase } from '../../../core/models';

@Component({
  selector: 'app-my-purchases',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, DatePipe],
  template: `
<app-navbar></app-navbar>
<div class="page-shell">
  <div class="container page-body">
    <div class="sh">
      <h2 class="st">My Purchases</h2>
      <a routerLink="/browse" class="btn btn-outline btn-sm">Browse More Notes</a>
    </div>

    @if (loading()) { <div class="sw"><div class="sp"></div></div> }
    @else if (purchases().length === 0) {
      <div class="es">
        <div class="icon">📚</div>
        <h3>No purchases yet</h3>
        <p>Browse our collection and buy your first set of notes.</p>
        <a routerLink="/browse" class="btn btn-primary" style="margin-top:1rem">Browse Notes</a>
      </div>
    } @else {
      <div class="pur-list">
        @for (p of purchases(); track p.id) {
          <div class="pur-row">
            <div class="pur-icon">📄</div>
            <div class="pur-info">
              <div class="pur-title">{{ p.note?.title || 'Purchased Note' }}</div>
              <div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-bottom:.3rem">
                @if (p.note?.classLevel) { <span class="badge badge-tl">{{ p.note?.classLevel }}</span> }
                @if (p.note?.subject)    { <span class="badge badge-gd">{{ p.note?.subject }}</span> }
              </div>
              <div class="pur-sub">Invoice: <strong>{{ p.invoiceNumber }}</strong> · {{ p.purchasedAt | date:'mediumDate' }}</div>
            </div>
            <div class="pur-right">
              <div class="pur-amt">₹{{ p.amount }}</div>
              <span class="badge badge-gn">{{ p.status }}</span>
              @if (p.note) {
                <a [routerLink]="['/notes', p.note.id, 'view']" class="btn btn-teal btn-sm">📖 Read</a>
              }
            </div>
          </div>
        }
      </div>

      @if (totalPages() > 1) {
        <div class="pgn">
          <button class="pb" (click)="go(page()-1)" [disabled]="page()===0">‹</button>
          @for (i of pageArr(); track i) {
            <button class="pb" [class.active]="i===page()" (click)="go(i)">{{ i+1 }}</button>
          }
          <button class="pb" (click)="go(page()+1)" [disabled]="page()>=totalPages()-1">›</button>
        </div>
      }
    }
  </div>
</div>
  `,
  styles: [`
    .pur-list { display:flex; flex-direction:column; gap:.85rem; }
    .pur-row  { background:#fff; border-radius:18px; padding:1.1rem 1.4rem; box-shadow:var(--sh); display:flex; align-items:center; gap:1.1rem; flex-wrap:wrap; transition:box-shadow var(--t); }
    .pur-row:hover { box-shadow:var(--shm); }
    .pur-icon { width:48px; height:48px; background:var(--tlp); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.4rem; flex-shrink:0; }
    .pur-info { flex:1; min-width:200px; }
    .pur-title{ font-weight:700; font-size:.9rem; margin-bottom:.3rem; }
    .pur-sub  { font-size:.75rem; color:var(--mu); }
    .pur-right{ display:flex; align-items:center; gap:.85rem; flex-wrap:wrap; }
    .pur-amt  { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:700; }
  `]
})
export class MyPurchasesComponent implements OnInit {
  purchases  = signal<Purchase[]>([]);
  loading    = signal(true);
  page       = signal(0);
  totalPages = signal(0);

  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }

  load(p = 0) {
    this.loading.set(true); this.page.set(p);
    this.api.getMyPurchases(p).subscribe(r => {
      this.loading.set(false);
      if (r.success) { this.purchases.set(r.data.content); this.totalPages.set(r.data.totalPages); }
    });
  }
  go(p: number) { if (p < 0 || p >= this.totalPages()) return; this.load(p); }
  pageArr() { return Array.from({ length: this.totalPages() }, (_, i) => i); }
}
