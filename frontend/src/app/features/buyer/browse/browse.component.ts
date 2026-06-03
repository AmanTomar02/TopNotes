import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { Note } from '@core/models';

@Component({
  selector: 'app-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  template: `
<app-navbar></app-navbar>
<div class="page-shell">

  <!-- Hero -->
  <div class="hero">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 70% at 75% 50%,rgba(30,107,107,.3),transparent 70%),radial-gradient(ellipse 40% 60% at 5% 80%,rgba(201,168,76,.18),transparent 60%)"></div>
    <div class="container hero-inner">
      <div class="hero-text">
        <div class="hero-kicker">✦ Verified by Academic Excellence</div>
        <h1>Learn from India's <span style="color:var(--gd)">smartest</span> students</h1>
        <p>Handwritten notes by verified toppers — JEE, NEET, Board exams. Secure, watermarked, trusted.</p>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          <a href="#notes" class="btn btn-gold btn-xl">Browse Notes ↓</a>
          <a routerLink="/register" class="btn btn-xl" style="background:rgba(255,255,255,.1);color:#fff;border:1.5px solid rgba(255,255,255,.22)">Sell Your Notes →</a>
        </div>
        <div class="hero-stats">
          <div><strong>500+</strong><span>Verified Sellers</span></div>
          <div><strong>12k+</strong><span>Notes Available</span></div>
          <div><strong>4.8★</strong><span>Avg Rating</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Search + Filters bar -->
  <div class="filter-bar" id="notes">
    <div class="container filter-inner">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input class="search-inp" [(ngModel)]="keyword" (ngModelChange)="onSearch()"
               placeholder="Search notes, topics, subjects…">
      </div>
      <select class="fc filter-sel" [(ngModel)]="classFilter" (ngModelChange)="load()">
        <option value="">All Classes</option>
        @for (c of classLevels(); track c) { <option [value]="c">{{ c }}</option> }
      </select>
      <select class="fc filter-sel" [(ngModel)]="subjectFilter" (ngModelChange)="load()">
        <option value="">All Subjects</option>
        @for (s of subjects(); track s) { <option [value]="s">{{ s }}</option> }
      </select>
      <select class="fc filter-sel" [(ngModel)]="examFilter" (ngModelChange)="load()">
        <option value="">All Exams</option>
        <option value="BOARD">Board</option>
        <option value="JEE_MAIN">JEE Main</option>
        <option value="JEE_ADVANCED">JEE Advanced</option>
        <option value="NEET">NEET</option>
        <option value="UPSC">UPSC</option>
        <option value="GATE">GATE</option>
        <option value="CAT">CAT</option>
      </select>
      @if (keyword || classFilter || subjectFilter || examFilter) {
        <button class="btn btn-outline btn-sm" (click)="clearFilters()">✕ Clear</button>
      }
    </div>
  </div>

  <!-- Notes grid -->
  <div class="container notes-area">
    <div class="sh">
      <h2 class="st">Latest Notes</h2>
      <span style="font-size:.82rem;color:var(--mu)">{{ totalElements() }} notes found</span>
    </div>

    @if (loading()) {
      <div class="sw"><div class="sp"></div></div>
    } @else if (notes().length === 0) {
      <div class="es">
        <div class="icon">📭</div>
        <h3>No notes found</h3>
        <p>Try adjusting your search or filters</p>
        <button class="btn btn-outline" style="margin-top:1rem" (click)="clearFilters()">Clear Filters</button>
      </div>
    } @else {
      <div class="ng fi">
        @for (n of notes(); track n.id) {
          <div class="nc" [routerLink]="['/notes', n.id]">
            <div class="ni" [style.background]="subjectBg(n.subject)">
              <div class="icon">{{ subjectIcon(n.subject) }}</div>
              <div class="sub">{{ n.subject }}</div>
              @if (n.examType) { <div class="exam">{{ examLabel(n.examType) }}</div> }
              @if (n.isPurchased) { <div class="own">✓ Owned</div> }
            </div>
            <div class="nb2">
              <div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-bottom:.45rem">
                @if (n.classLevel) { <span class="badge badge-tl">{{ n.classLevel }}</span> }
                @if (n.subject)    { <span class="badge badge-gd">{{ n.subject }}</span> }
              </div>
              <div class="nt">{{ n.title }}</div>
              <div class="nd">{{ n.description }}</div>
              @if (n.seller) {
                <div style="display:flex;align-items:center;gap:.45rem;margin-bottom:.55rem">
                  <div style="width:20px;height:20px;border-radius:50%;background:var(--ink);color:var(--gd);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700">{{ n.seller.fullName.charAt(0) }}</div>
                  <span style="font-size:.75rem;color:var(--mu)">{{ n.seller.fullName }}</span>
                </div>
              }
              <div class="nf">
                <div class="np">₹{{ n.price }}</div>
                @if (n.reviewCount) {
                  <div class="nr"><span class="stars">{{ stars(n.averageRating) }}</span> {{ n.averageRating?.toFixed(1) }} ({{ n.reviewCount }})</div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }

    <!-- Pagination -->
    @if (totalPages() > 1) {
      <div class="pgn">
        <button class="pb" (click)="goPage(page()-1)" [disabled]="page()===0">‹</button>
        @for (p of pageArr(); track p) {
          <button class="pb" [class.active]="p===page()" (click)="goPage(p)">{{ p+1 }}</button>
        }
        <button class="pb" (click)="goPage(page()+1)" [disabled]="page()>=totalPages()-1">›</button>
      </div>
    }
  </div>
</div>
  `,
  styles: [`
    .hero { background:var(--ink);padding:5rem 0 4rem;position:relative;overflow:hidden; }
    .hero-inner { position:relative; }
    .hero-text { max-width:580px; }
    .hero-kicker { display:inline-flex;align-items:center;padding:.28rem .8rem;background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.28);border-radius:100px;font-size:.74rem;font-weight:600;color:var(--gdl);letter-spacing:.05em;margin-bottom:1.2rem; }
    .hero h1 { font-size:clamp(2rem,4.5vw,3.2rem);color:#fff;margin-bottom:.9rem;line-height:1.1; }
    .hero p  { color:rgba(255,255,255,.6);font-size:.95rem;line-height:1.7;margin-bottom:1.75rem;max-width:480px; }
    .hero-stats { display:flex;gap:2.2rem;margin-top:2rem; }
    .hero-stats div { display:flex;flex-direction:column; }
    .hero-stats strong { font-family:'Cormorant Garamond',serif;font-size:1.55rem;color:var(--gd);font-weight:700;display:block; }
    .hero-stats span   { font-size:.7rem;color:rgba(255,255,255,.4);font-weight:600;text-transform:uppercase;letter-spacing:.07em; }
    .filter-bar { background:#fff;border-bottom:1px solid var(--cr3);padding:.9rem 0;position:sticky;top:68px;z-index:100;box-shadow:var(--sh); }
    .filter-inner { display:flex;gap:.6rem;align-items:center;flex-wrap:wrap; }
    .search-wrap { flex:1;min-width:200px;position:relative; }
    .search-icon { position:absolute;left:.8rem;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--mu); }
    .search-inp { width:100%;padding:.55rem .85rem .55rem 2.4rem;border:1.5px solid var(--cr3);border-radius:var(--r);font-family:'Outfit',sans-serif;font-size:.85rem;color:var(--ink);background:var(--cr);transition:border-color var(--t); }
    .search-inp:focus { border-color:var(--tl);outline:none; }
    .filter-sel { width:auto;min-width:135px;padding:.52rem .85rem;border-radius:var(--r);font-size:.85rem; }
    .notes-area { padding:1.75rem 0 4rem; }
  `]
})
export class BrowseComponent implements OnInit {
  notes         = signal<Note[]>([]);
  subjects      = signal<string[]>([]);
  classLevels   = signal<string[]>([]);
  loading       = signal(true);
  totalElements = signal(0);
  totalPages    = signal(0);
  page          = signal(0);
  keyword       = '';
  classFilter   = '';
  subjectFilter = '';
  examFilter    = '';
  private timer: any;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.api.getFilters().subscribe(r => {
      if (r.success) { this.subjects.set(r.data.subjects); this.classLevels.set(r.data.classLevels); }
    });
    this.load();
  }

  load(p = 0) {
    this.loading.set(true);
    this.page.set(p);
    this.api.getNotes({
      keyword:    this.keyword    || undefined,
      classLevel: this.classFilter  || undefined,
      subject:    this.subjectFilter || undefined,
      examType:   this.examFilter   || undefined,
      page: p, size: 12
    }).subscribe(r => {
      this.loading.set(false);
      if (r.success) {
        this.notes.set(r.data.content);
        this.totalPages.set(r.data.totalPages);
        this.totalElements.set(r.data.totalElements);
      }
    });
  }

  onSearch() { clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 380); }
  goPage(p: number) { if (p < 0 || p >= this.totalPages()) return; this.load(p); window.scrollTo({ top: 300, behavior: 'smooth' }); }
  clearFilters() { this.keyword = ''; this.classFilter = ''; this.subjectFilter = ''; this.examFilter = ''; this.load(); }
  pageArr() { const t = this.totalPages(), c = this.page(), s = Math.max(0, c-2), e = Math.min(t, s+5); return Array.from({length:e-s},(_,i)=>s+i); }

  stars(r?: number) { if (!r) return '☆☆☆☆☆'; return '★'.repeat(Math.floor(r)) + '☆'.repeat(5 - Math.floor(r)); }
  examLabel(e: string) { const m: any = {BOARD:'Board',JEE_MAIN:'JEE Main',JEE_ADVANCED:'JEE Adv.',NEET:'NEET',UPSC:'UPSC',GATE:'GATE',CAT:'CAT',OTHER:'Other'}; return m[e] || e; }
  subjectIcon(s?: string) { const m: any = {Physics:'⚡',Chemistry:'⚗️',Mathematics:'∫',Biology:'🫀',History:'📜',Geography:'🌍',English:'📖',Computer:'💻'}; return (s && m[s]) ? m[s] : '📄'; }
  subjectBg(s?: string) { const m: any = {Physics:'#1a2e4a',Chemistry:'#2e2a1a',Mathematics:'#1a3a2e',Biology:'#2e1a2e',History:'#1a1a2e',Geography:'#1a2e1a'}; return (s && m[s]) ? m[s] : '#1e1c2e'; }
}
