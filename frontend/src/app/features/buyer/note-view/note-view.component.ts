import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { Note } from '@core/models';

GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.mjs';

/**
 * Full-screen secure reader. Renders PDF pages on canvas (no browser download toolbar),
 * bakes a per-user watermark into each page, and blocks common save/print shortcuts.
 */
@Component({
  selector: 'app-note-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: {
    class: 'secure-viewer-host',
    '(contextmenu)': '$event.preventDefault()',
  },
  template: `
    <div class="viewer">
      <div class="viewer-top">
        <a class="vt-close" routerLink="/my-purchases" aria-label="Close viewer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </a>
        <span class="vt-title">{{ note()?.title || 'Loading…' }}</span>
        <span class="vt-protected">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.7" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.7" />
          </svg>
          Protected content
        </span>
        @if (totalPages()) {
          <span class="vt-page">Page {{ currentPage() }} / {{ totalPages() }}</span>
        }
      </div>

      <div class="viewer-stage secure-stage" [class.viewer-blurred]="blurred()">
        @if (loading()) {
          <div class="viewer-message">Loading secure document…</div>
        } @else if (error()) {
          <div class="viewer-message viewer-message--error">
            <p>Couldn't load this note.</p>
            <a class="btn btn-secondary" routerLink="/my-purchases">Back to My Purchases</a>
          </div>
        } @else {
          <div class="doc-page secure-doc-page">
            <canvas #pageCanvas class="secure-canvas"></canvas>
            <div class="watermark watermark--overlay" aria-hidden="true">
              @for (m of marks; track $index) {
                <span>{{ watermarkText() }}</span>
              }
            </div>
          </div>
        }
      </div>

      @if (!loading() && !error() && totalPages() > 0) {
        <div class="viewer-nav">
          <button type="button" [disabled]="currentPage() <= 1" (click)="prevPage()" aria-label="Previous page">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 5 8 12l7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <span class="vn-page">Page {{ currentPage() }}</span>
          <button type="button" [disabled]="currentPage() >= totalPages()" (click)="nextPage()" aria-label="Next page">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class NoteViewComponent {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  private canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('pageCanvas');

  protected note = signal<Note | null>(null);
  protected loading = signal(true);
  protected error = signal(false);
  protected currentPage = signal(1);
  protected totalPages = signal(0);
  protected blurred = signal(false);
  protected marks = Array.from({ length: 40 });

  private id = Number(this.route.snapshot.paramMap.get('id'));
  private pdfDoc: PDFDocumentProxy | null = null;
  private rendering = false;

  protected watermarkText = computed(() => `${this.auth.user()?.email ?? 'TopNotes'} · TopNotes`);

  constructor() {
    document.body.classList.add('viewer-mode');

    this.api
      .getNote(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.note.set(r.data);
          if (r.data.totalPages) this.totalPages.set(r.data.totalPages);
        },
        error: () => {},
      });

    this.api
      .getNotePdf(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => void this.loadPdf(blob),
        error: () => {
          this.loading.set(false);
          this.error.set(true);
        },
      });

    this.destroyRef.onDestroy(() => {
      document.body.classList.remove('viewer-mode');
      void this.pdfDoc?.destroy();
      this.pdfDoc = null;
    });
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const mod = event.ctrlKey || event.metaKey;

    if (
      (mod && ['s', 'p', 'u', 'c', 'a'].includes(key)) ||
      (mod && event.shiftKey && key === 'i') ||
      key === 'f12' ||
      key === 'printscreen'
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.blurred.set(true);
      window.setTimeout(() => this.blurred.set(document.hidden), 400);
    }
  }

  @HostListener('document:visibilitychange')
  protected onVisibilityChange(): void {
    this.blurred.set(document.hidden);
  }

  @HostListener('window:blur')
  protected onWindowBlur(): void {
    this.blurred.set(true);
  }

  @HostListener('window:focus')
  protected onWindowFocus(): void {
    if (!document.hidden) this.blurred.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  protected handleDocumentKeyDown(event: KeyboardEvent): void {
    this.onKeyDown(event);
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      void this.renderCurrentPage();
    }
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      void this.renderCurrentPage();
    }
  }

  private async loadPdf(blob: Blob): Promise<void> {
    try {
      const data = await blob.arrayBuffer();
      this.pdfDoc = await getDocument({ data, disableAutoFetch: false, disableStream: false }).promise;
      this.totalPages.set(this.pdfDoc.numPages);
      this.currentPage.set(1);
      this.loading.set(false);
      await this.renderCurrentPage();
    } catch {
      this.loading.set(false);
      this.error.set(true);
    }
  }

  private async renderCurrentPage(): Promise<void> {
    if (!this.pdfDoc || this.rendering) return;

    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      window.setTimeout(() => void this.renderCurrentPage(), 0);
      return;
    }

    this.rendering = true;
    try {
      const page = await this.pdfDoc.getPage(this.currentPage());
      const baseViewport = page.getViewport({ scale: 1 });
      const maxWidth = Math.min(720, window.innerWidth - 48);
      const scale = maxWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await page.render({ canvasContext: ctx, viewport }).promise;
      this.drawWatermark(ctx, viewport.width, viewport.height);
    } finally {
      this.rendering = false;
    }
  }

  private drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const text = this.watermarkText();
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillStyle = '#475467';
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-30 * (Math.PI / 180));

    for (let y = -height * 1.2; y < height * 1.2; y += 72) {
      for (let x = -width * 1.2; x < width * 1.2; x += 220) {
        ctx.fillText(text, x, y);
      }
    }
    ctx.restore();
  }
}
