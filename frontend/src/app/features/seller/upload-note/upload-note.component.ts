import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ApiService } from '@core/services/api.service';

@Component({
  selector: 'app-upload-note',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  template: `
<app-navbar></app-navbar>
<div class="page-shell">
<div class="container" style="max-width:860px;padding-top:1.75rem;padding-bottom:4rem">

  <h2 style="font-size:1.5rem;margin-bottom:.35rem">Upload New Notes</h2>
  <p style="color:var(--mu);font-size:.85rem;margin-bottom:1.75rem">Share your knowledge and earn from every purchase.</p>

  @if (error())   { <div class="alert alert-error">{{ error() }}</div> }
  @if (success()) { <div class="alert alert-success">{{ success() }}</div> }

  <div style="background:#fff;border-radius:22px;padding:2rem;box-shadow:var(--sh)">
    <div class="form-grid">

      <div class="fg span2">
        <label class="fl">Title *</label>
        <input class="fc" [(ngModel)]="title" placeholder="e.g. Complete JEE Physics — Electrostatics Chapter" maxlength="250">
      </div>

      <div class="fg span2">
        <label class="fl">Description * <span style="font-weight:400;color:var(--mu)">(explain what topics are covered)</span></label>
        <textarea class="fc" [(ngModel)]="description" rows="4"
          placeholder="Describe topics covered, chapters, reference books, difficulty level…" maxlength="5000"></textarea>
      </div>

      <div class="fg">
        <label class="fl">Class / Level</label>
        <select class="fc" [(ngModel)]="classLevel">
          <option value="">Select class</option>
          <option>Class 9</option><option>Class 10</option>
          <option>Class 11</option><option>Class 12</option>
          <option>Dropper</option><option>Repeater</option>
        </select>
      </div>

      <div class="fg">
        <label class="fl">Subject</label>
        <input class="fc" [(ngModel)]="subject" placeholder="e.g. Physics, Mathematics, Biology">
      </div>

      <div class="fg">
        <label class="fl">Exam Type</label>
        <select class="fc" [(ngModel)]="examType">
          <option value="">Select exam</option>
          <option value="BOARD">Board</option>
          <option value="JEE_MAIN">JEE Main</option>
          <option value="JEE_ADVANCED">JEE Advanced</option>
          <option value="NEET">NEET</option>
          <option value="UPSC">UPSC</option>
          <option value="GATE">GATE</option>
          <option value="CAT">CAT</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div class="fg">
        <label class="fl">Price (₹) *</label>
        <input class="fc" type="number" [(ngModel)]="price" min="1" max="99999" placeholder="e.g. 199">
      </div>

      <!-- PDF upload -->
      <div class="fg span2">
        <label class="fl">Notes PDF * <span style="font-weight:400;color:var(--mu)">(max 50MB)</span></label>
        <div class="dropz" (click)="pdfInput.click()" [class.has]="pdfFile"
             (dragover)="$event.preventDefault()" (drop)="onDrop($event, 'pdf')">
          @if (pdfFile) {
            <div style="color:var(--tl);font-weight:600;font-size:.9rem">📄 {{ pdfFile.name }} <span style="font-weight:400;color:var(--mu)">({{ (pdfFile.size/1048576).toFixed(1) }}MB)</span></div>
          } @else {
            <div class="dz-inner"><span>📄</span><strong>Click or drag to upload PDF</strong><span class="dz-hint">PDF only · Max 50MB</span></div>
          }
        </div>
        <input #pdfInput type="file" accept="application/pdf" style="display:none" (change)="onPdf($event)">
      </div>

      <!-- Thumbnail upload -->
      <div class="fg span2">
        <label class="fl">Thumbnail Image <span style="font-weight:400;color:var(--mu)">(optional — shown in listing card)</span></label>
        <div class="dropz thumb-dz" (click)="thumbInput.click()" [class.has]="thumbFile"
             (dragover)="$event.preventDefault()" (drop)="onDrop($event, 'thumb')">
          @if (thumbPreview) {
            <img [src]="thumbPreview" style="max-height:130px;border-radius:10px;object-fit:cover">
          } @else {
            <div class="dz-inner"><span>🖼️</span><strong>Click or drag to upload thumbnail</strong><span class="dz-hint">JPG, PNG · Max 5MB</span></div>
          }
        </div>
        <input #thumbInput type="file" accept="image/*" style="display:none" (change)="onThumb($event)">
      </div>

    </div>

    <div style="border-top:1px solid var(--cr3);padding-top:1.5rem;display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap">
      <button class="btn btn-primary btn-xl" (click)="upload()" [disabled]="loading()">
        @if (loading()) { <span class="sp-btn"></span> }
        {{ loading() ? 'Publishing…' : 'Publish Notes' }}
      </button>
      <a routerLink="/seller/notes" class="btn btn-outline">Cancel</a>
      <span style="font-size:.78rem;color:var(--mu)">Your notes go live immediately after publishing.</span>
    </div>
  </div>
</div>
</div>
  `,
  styles: [`
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:0 1.5rem; }
    .span2 { grid-column:span 2; }
    .dropz { border:2px dashed var(--cr3); border-radius:14px; padding:2rem; text-align:center; cursor:pointer; transition:all var(--t); margin-bottom:.2rem; }
    .dropz:hover,.dropz.has { border-color:var(--tl); background:var(--tlp); }
    .thumb-dz { padding:1.25rem; }
    .dz-inner { display:flex; flex-direction:column; gap:.3rem; align-items:center; color:var(--mu); }
    .dz-inner span:first-child { font-size:1.6rem; }
    .dz-inner strong { color:var(--ink); font-size:.9rem; }
    .dz-hint { font-size:.76rem; }
    .sp-btn { width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:640px){ .form-grid{grid-template-columns:1fr} .span2{grid-column:span 1} }
  `]
})
export class UploadNoteComponent {
  title       = '';
  description = '';
  classLevel  = '';
  subject     = '';
  examType    = '';
  price: number | null = null;
  pdfFile:    File | null = null;
  thumbFile:  File | null = null;
  thumbPreview: string | null = null;
  loading = signal(false);
  error   = signal('');
  success = signal('');

  constructor(private api: ApiService, private router: Router) {}

  onPdf(e: Event) {
    this.pdfFile = (e.target as HTMLInputElement).files?.[0] || null;
  }

  onThumb(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) { this.thumbFile = f; const reader = new FileReader(); reader.onload = ev => this.thumbPreview = ev.target?.result as string; reader.readAsDataURL(f); }
  }

  onDrop(e: DragEvent, type: 'pdf' | 'thumb') {
    e.preventDefault();
    const f = e.dataTransfer?.files[0];
    if (!f) return;
    if (type === 'pdf') { this.pdfFile = f; }
    else { this.thumbFile = f; const reader = new FileReader(); reader.onload = ev => this.thumbPreview = ev.target?.result as string; reader.readAsDataURL(f); }
  }

  upload() {
    if (!this.title.trim())       { this.error.set('Title is required.'); return; }
    if (!this.description.trim()) { this.error.set('Description is required.'); return; }
    if (!this.price || this.price < 1) { this.error.set('Please enter a valid price (min ₹1).'); return; }
    if (!this.pdfFile)            { this.error.set('Please upload the PDF notes file.'); return; }

    this.loading.set(true); this.error.set(''); this.success.set('');

    const fd = new FormData();
    fd.append('data', new Blob([JSON.stringify({
      title:       this.title,
      description: this.description,
      classLevel:  this.classLevel  || undefined,
      subject:     this.subject     || undefined,
      examType:    this.examType    || undefined,
      price:       this.price
    })], { type: 'application/json' }));
    fd.append('pdf', this.pdfFile);
    if (this.thumbFile) fd.append('thumbnail', this.thumbFile);

    this.api.uploadNote(fd).subscribe({
      next: r => {
        this.loading.set(false);
        if (r.success) { this.success.set('Notes published successfully!'); setTimeout(() => this.router.navigate(['/seller/notes']), 1000); }
        else this.error.set(r.message);
      },
      error: err => { this.loading.set(false); this.error.set(err?.error?.message || 'Upload failed. Please try again.'); }
    });
  }
}
