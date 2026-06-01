import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ApiService } from '../../../core/services/api.service';
import { Note } from '../../../core/models';

@Component({
  selector: 'app-my-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  template: `
<app-navbar></app-navbar>
<div class="page-shell">
<div class="container page-body">
  <div class="sh">
    <h2 class="st">My Notes</h2>
    <a routerLink="/seller/upload" class="btn btn-primary btn-sm">+ Upload New</a>
  </div>

  @if (loading()) { <div class="sw"><div class="sp"></div></div> }
  @else if (notes().length === 0) {
    <div class="es">
      <div class="icon">📭</div>
      <h3>No notes yet</h3>
      <p>Start uploading your handwritten notes to earn money.</p>
      <a routerLink="/seller/upload" class="btn btn-primary" style="margin-top:1rem">Upload First Note</a>
    </div>
  } @else {
    <div class="notes-list">
      @for (n of notes(); track n.id) {
        <div class="note-row">
          <div class="nr-thumb">
            @if (n.thumbnailUrl) { <img [src]="apiUrl + n.thumbnailUrl" alt="thumbnail"> }
            @else { <span>📄</span> }
          </div>

          <div class="nr-info">
            <div class="nr-title">{{ n.title }}</div>
            <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:.35rem">
              @if (n.classLevel) { <span class="badge badge-tl">{{ n.classLevel }}</span> }
              @if (n.subject)    { <span class="badge badge-gd">{{ n.subject }}</span> }
              @if (n.examType)   { <span class="badge badge-ik">{{ n.examType }}</span> }
            </div>
            <div class="nr-stats">
              <span>🛒 {{ n.purchaseCount || 0 }} sales</span>
              <span>⭐ {{ n.averageRating?.toFixed(1) || '—' }}</span>
              <span>📝 {{ n.reviewCount || 0 }} reviews</span>
            </div>
          </div>

          <div class="nr-price">
            @if (editingId() === n.id) {
              <div class="price-edit">
                <input class="fc" type="number" [(ngModel)]="newPrice" min="1" style="width:100px">
                <button class="btn btn-teal btn-sm" (click)="savePrice(n)">Save</button>
                <button class="btn btn-outline btn-sm" (click)="editingId.set(null)">Cancel</button>
              </div>
            } @else {
              <div style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:700;margin-bottom:.5rem">₹{{ n.price }}</div>
              <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                <button class="btn btn-outline btn-sm" (click)="startEdit(n)">Edit Price</button>
                <a [routerLink]="['/notes', n.id]" class="btn btn-outline btn-sm">View</a>
                <button class="btn btn-danger btn-sm" (click)="del(n)">Delete</button>
              </div>
            }
          </div>
        </div>
      }
    </div>

    @if (totalPages() > 1) {
      <div class="pgn">
        <button class="pb" (click)="go(page()-1)" [disabled]="page()===0">‹</button>
        @for (i of pageArr(); track i) { <button class="pb" [class.active]="i===page()" (click)="go(i)">{{ i+1 }}</button> }
        <button class="pb" (click)="go(page()+1)" [disabled]="page()>=totalPages()-1">›</button>
      </div>
    }
  }
</div>
</div>
  `,
  styles: [`
    .notes-list { display:flex; flex-direction:column; gap:.75rem; }
    .note-row { background:#fff; border-radius:16px; padding:1.1rem 1.25rem; box-shadow:var(--sh); display:flex; align-items:center; gap:1.1rem; flex-wrap:wrap; transition:box-shadow var(--t); }
    .note-row:hover { box-shadow:var(--shm); }
    .nr-thumb { width:56px; height:56px; border-radius:10px; overflow:hidden; background:var(--cr2); display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0; }
    .nr-thumb img { width:100%; height:100%; object-fit:cover; }
    .nr-info { flex:1; min-width:200px; }
    .nr-title { font-weight:700; font-size:.9rem; margin-bottom:.35rem; }
    .nr-stats { display:flex; gap:1rem; font-size:.78rem; color:var(--mu); flex-wrap:wrap; margin-top:.3rem; }
    .nr-price { display:flex; flex-direction:column; align-items:flex-end; }
    .price-edit { display:flex; gap:.4rem; align-items:center; flex-wrap:wrap; }
  `]
})
export class MyNotesComponent implements OnInit {
  notes      = signal<Note[]>([]);
  loading    = signal(true);
  page       = signal(0);
  totalPages = signal(0);
  editingId  = signal<number | null>(null);
  newPrice   = 0;
  apiUrl     = '';

  constructor(private api: ApiService) {
    this.apiUrl = api.base.replace('/api', '');
  }

  ngOnInit() { this.load(); }

  load(p = 0) {
    this.loading.set(true); this.page.set(p);
    this.api.getSellerNotes(p).subscribe(r => {
      this.loading.set(false);
      if (r.success) { this.notes.set(r.data.content); this.totalPages.set(r.data.totalPages); }
    });
  }

  startEdit(n: Note) { this.editingId.set(n.id); this.newPrice = n.price; }

  savePrice(n: Note) {
    this.api.updateNotePrice(n.id, this.newPrice).subscribe(r => {
      if (r.success) { n.price = this.newPrice; this.editingId.set(null); }
    });
  }

  del(n: Note) {
    if (!confirm(`Delete "${n.title}"? This cannot be undone.`)) return;
    this.api.deleteNote(n.id).subscribe(r => {
      if (r.success) this.notes.update(ns => ns.filter(x => x.id !== n.id));
    });
  }

  go(p: number) { if (p < 0 || p >= this.totalPages()) return; this.load(p); }
  pageArr() { return Array.from({ length: this.totalPages() }, (_, i) => i); }
}
