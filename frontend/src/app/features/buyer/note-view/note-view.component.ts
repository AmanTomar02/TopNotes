import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { Note } from '@core/models';

/**
 * Full-screen secure reader. Loads the PDF as a blob (so the URL isn't a direct link),
 * renders it inside the viewer with a per-user watermark overlay. Outside the app shell.
 * NOTE: true copy-protection must be server-side (see FRONTEND_AUDIT.md) — this mirrors the design.
 */
@Component({
  selector: 'app-note-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
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
        @if (note()?.totalPages) {
          <span class="vt-page">{{ note()?.totalPages }} pages</span>
        }
      </div>

      <div class="viewer-stage" oncontextmenu="return false">
        @if (loading()) {
          <div style="color:rgba(255,255,255,.6);margin-top:80px;">Loading secure document…</div>
        } @else if (error()) {
          <div style="color:rgba(255,255,255,.7);margin-top:80px;text-align:center;">
            <p>Couldn't load this note.</p>
            <a class="btn btn-secondary" routerLink="/my-purchases" style="margin-top:12px;">Back to My Purchases</a>
          </div>
        } @else {
          @if (pdfUrl(); as url) {
            <div style="position:relative;width:min(820px,100%);height:100%;">
              <iframe
                [src]="url"
                title="Note document"
                style="width:100%;height:100%;border:none;border-radius:6px;background:#fff;"
              ></iframe>
              <div class="watermark">
                @for (m of marks; track $index) {
                  <span>{{ watermarkText() }}</span>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class NoteViewComponent {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);

  protected note = signal<Note | null>(null);
  protected pdfUrl = signal<SafeResourceUrl | null>(null);
  protected loading = signal(true);
  protected error = signal(false);
  protected marks = Array.from({ length: 40 });

  private id = Number(this.route.snapshot.paramMap.get('id'));
  private objectUrl: string | null = null;

  protected watermarkText = computed(() => `${this.auth.user()?.email ?? 'TopNotes'} · TopNotes`);

  constructor() {
    document.body.classList.add('viewer-body');

    this.api
      .getNote(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (r) => this.note.set(r.data), error: () => {} });

    this.api
      .getNotePdf(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.objectUrl = URL.createObjectURL(blob);
          this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set(true);
        },
      });

    this.destroyRef.onDestroy(() => {
      document.body.classList.remove('viewer-body');
      if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    });
  }
}
