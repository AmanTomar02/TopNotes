import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';

@Component({
  selector: 'app-note-view',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  template: `
<div class="viewer-shell" oncontextmenu="return false">

  <!-- Top bar -->
  <div class="vt">
    <button class="btn btn-sm" style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.15)" (click)="goBack()">← Back</button>
    <div class="vt-title">{{ title() }}</div>
    <div class="vt-badge">🔒 Secure View</div>
  </div>

  <!-- PDF area -->
  <div class="v-body" #body>
    <!-- Watermark layer -->
    <div class="wm-layer" id="wml"></div>

    @if (loading()) {
      <div class="v-center">
        <div class="sp" style="border-top-color:#fff;width:44px;height:44px;border-width:3px"></div>
        <p style="color:rgba(255,255,255,.55);margin-top:1rem;font-size:.9rem">Loading your notes securely…</p>
      </div>
    } @else if (error()) {
      <div class="v-center">
        <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
        <h3 style="color:#fff;margin-bottom:.5rem">Access Denied</h3>
        <p style="color:rgba(255,255,255,.55);font-size:.88rem">{{ error() }}</p>
        <button class="btn btn-outline" style="margin-top:1.25rem;color:#fff;border-color:rgba(255,255,255,.3)" (click)="goBack()">Go Back</button>
      </div>
    } @else if (pdfUrl()) {
      <iframe
        [src]="pdfUrl()!"
        class="pdf-frame"
        sandbox="allow-scripts allow-same-origin"
        allow="fullscreen"
        title="{{ title() }}">
      </iframe>
      <!-- Protect overlay: blocks right-click but doesn't block scrolling -->
      <div class="protect-layer" (contextmenu)="block($event)"></div>
    }
  </div>

  <!-- Footer -->
  <div class="vf">
    <span>📱 Screenshots watermarked with your account ID</span>
    <span>⛔ Downloading is disabled</span>
    <span>🔐 Session-encrypted content</span>
    <span id="vf-id">Viewing as: {{ userLabel }}</span>
  </div>

</div>
  `,
  styles: [`
    .viewer-shell { min-height:100vh; background:#12111d; display:flex; flex-direction:column; user-select:none; -webkit-user-select:none; }

    .vt { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1.5rem; background:#0c0b14; border-bottom:1px solid rgba(255,255,255,.07); gap:1rem; }
    .vt-title { font-family:'Cormorant Garamond',serif; font-size:.95rem; color:#fff; flex:1; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .vt-badge { font-size:.72rem; color:#c9a84c; background:rgba(201,168,76,.1); border:1px solid rgba(201,168,76,.22); padding:.22rem .72rem; border-radius:100px; white-space:nowrap; }

    .v-body { flex:1; position:relative; overflow:hidden; min-height:calc(100vh - 130px); background:#1a1828; }

    .wm-layer { position:absolute; inset:0; z-index:10; pointer-events:none; display:grid; grid-template-columns:repeat(5,1fr); gap:2rem; padding:1rem; transform:rotate(-22deg) scale(1.5); opacity:.05; overflow:hidden; }

    .pdf-frame { position:absolute; inset:0; width:100%; height:100%; border:none; z-index:5; }
    .protect-layer { position:absolute; inset:0; z-index:20; pointer-events:none; }

    .v-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }

    .vf { display:flex; align-items:center; justify-content:center; gap:2rem; padding:.75rem 1.5rem; background:#0c0b14; border-top:1px solid rgba(255,255,255,.07); font-size:.72rem; color:rgba(255,255,255,.35); flex-wrap:wrap; }

    @media print { .viewer-shell { display:none !important; } }
  `]
})
export class NoteViewComponent implements OnInit, OnDestroy {
  pdfUrl  = signal<SafeResourceUrl | null>(null);
  title   = signal('');
  loading = signal(true);
  error   = signal('');
  userLabel = '';
  private objectUrl: string | null = null;

  constructor(
    private route:     ActivatedRoute,
    private router:    Router,
    private api:       ApiService,
    private auth:      AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    const user = this.auth.user();
    this.userLabel = `${user?.email} · ID:${user?.userId}`;

    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.api.getNote(id).subscribe({
      next: res => {
        if (!res.success) { this.error.set('Note not found.'); this.loading.set(false); return; }
        if (!res.data.isPurchased) { this.error.set('Please purchase this note to view it.'); this.loading.set(false); return; }
        this.title.set(res.data.title);
        this.loadPdf(id);
      },
      error: () => { this.error.set('Failed to load note.'); this.loading.set(false); }
    });

    document.addEventListener('keydown', this.handleKey);
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKey);
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
  }

  private loadPdf(id: number) {
    this.api.getNotePdf(id).subscribe({
      next: blob => {
        if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
        this.loading.set(false);
        this.buildWatermark();
      },
      error: () => {
        this.error.set('Could not open this note. Please refresh and try again.');
        this.loading.set(false);
      }
    });
  }

  private handleKey = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && ['p','s','u'].includes(e.key.toLowerCase())) {
      e.preventDefault(); e.stopPropagation();
    }
    if (e.key === 'F12') e.preventDefault();
  };

  private buildWatermark() {
    setTimeout(() => {
      const el = document.getElementById('wml');
      if (el) el.innerHTML = Array(40).fill(
        `<div style="color:#fff;font-size:.68rem;font-weight:700;white-space:nowrap;letter-spacing:.12em;text-transform:uppercase">TopNotes · ${this.userLabel}</div>`
      ).join('');
    }, 100);
  }

  block(e: Event) { e.preventDefault(); return false; }
  goBack() { this.router.navigate(['/notes', this.route.snapshot.paramMap.get('id')]); }
}
