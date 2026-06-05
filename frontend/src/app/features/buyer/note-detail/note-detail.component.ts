import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { Note, Review } from '@core/models';
import { examLabel, initials, subjectGradient } from '@shared/util/note-display';

@Component({
  selector: 'app-note-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  template: `
    <a class="btn btn-ghost btn-sm" routerLink="/browse" style="margin-bottom:16px;">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M10 3 5 8l5 5"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      Back to browse
    </a>

    @if (loading()) {
      <div class="detail-grid">
        <div><div class="skel" style="aspect-ratio:1/1.3;max-width:420px;border-radius:12px"></div></div>
        <div class="skel" style="height:280px;border-radius:12px"></div>
      </div>
    } @else {
      @if (note(); as n) {
        <div class="detail-grid">
          <div>
            <div class="preview-box">
              <div class="thumb" style="position:absolute;inset:0;height:100%" [style.background]="thumbBg()">
                <span class="thumb-glyph">{{ glyph() }}</span>
              </div>
              <div class="preview-lock">
                <span class="lock-pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.7" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.7" />
                  </svg>
                  Preview only · full notes after purchase
                </span>
              </div>
            </div>

            <div class="detail-badges">
              @if (n.subject) {
                <span class="badge badge-indigo">{{ n.subject }}</span>
              }
              @if (n.examType) {
                <span class="badge badge-amber">{{ examLabel() }}</span>
              }
              @if (n.classLevel) {
                <span class="badge">{{ n.classLevel }}</span>
              }
            </div>
            <h1 class="detail-title">{{ n.title }}</h1>
            <div class="nc-meta" style="margin-top:12px;">
              <span class="stars" style="--st:18px">
                @for (f of starArr(); track $index) {
                  <svg [class.empty]="!f" viewBox="0 0 24 24" fill="currentColor">
                    <path d="m12 2 2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.6 6.1 20.6l1.3-6.5L2.5 8.9l6.6-.8L12 2Z" />
                  </svg>
                }
              </span>
              <span class="rating-text">{{ (n.averageRating || 0).toFixed(1) }}</span>
              <span class="rating-count">({{ n.reviewCount || 0 }} reviews)</span>
            </div>
            <p class="detail-desc">{{ n.description }}</p>

            <div class="detail-facts">
              <div class="fact">
                <div class="f-label">Pages</div>
                <div class="f-value">{{ n.totalPages || '—' }}</div>
              </div>
              <div class="fact">
                <div class="f-label">Format</div>
                <div class="f-value">PDF</div>
              </div>
              <div class="fact">
                <div class="f-label">Exam</div>
                <div class="f-value">{{ examLabel() || '—' }}</div>
              </div>
              <div class="fact">
                <div class="f-label">Class</div>
                <div class="f-value">{{ (n.classLevel || '').replace('Class ', '') || '—' }}</div>
              </div>
            </div>

            @if (n.seller; as s) {
              <div class="card seller-mini">
                <span class="avatar avatar-lg">{{ sellerInitials() }}</span>
                <div class="sm-body">
                  <h4>
                    {{ s.fullName }}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2.5 4 6v5c0 5 3.5 8 8 9.5 4.5-1.5 8-4.5 8-9.5V6l-8-3.5Z"
                        fill="#EEEBFB"
                        stroke="#5B4BE0"
                        stroke-width="1.4"
                        stroke-linejoin="round"
                      />
                      <path
                        d="m9 12 2 2 4-4.5"
                        stroke="#5B4BE0"
                        stroke-width="1.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </h4>
                  @if (s.institution) {
                    <div class="sm-inst">{{ s.institution }}</div>
                  }
                  @if (s.bio) {
                    <p class="sm-bio">{{ s.bio }}</p>
                  }
                </div>
              </div>
            }
          </div>

          <!-- purchase card -->
          <div class="card purchase-card">
            <div class="pc-price">₹{{ (n.price || 0).toLocaleString('en-IN') }} <small>one-time</small></div>

            @if (isPurchased()) {
              <a
                class="btn btn-primary btn-lg btn-block"
                style="margin-top:16px;background:var(--success);"
                [routerLink]="['/notes', n.id, 'view']"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="margin-right:4px;">
                  <path
                    d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5v-12Z"
                    stroke="white"
                    stroke-width="1.6"
                  />
                  <path
                    d="M20 5.5C20 4.7 19.3 4 18.5 4H13v15h5.5a1.5 1.5 0 0 0 1.5-1.5v-12Z"
                    stroke="white"
                    stroke-width="1.6"
                  />
                </svg>
                Read notes
              </a>
            } @else {
              <button
                class="btn btn-primary btn-lg btn-block"
                style="margin-top:16px;"
                [attr.data-loading]="purchasing() ? '1' : null"
                (click)="buy()"
              >
                <span class="btn-spin"></span>
                <span>Buy for ₹{{ (n.price || 0).toLocaleString('en-IN') }}</span>
              </button>
            }

            <div class="pc-secure">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.6" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.6" />
              </svg>
              View-only access · watermarked with your email · no download
            </div>
            <ul class="pc-includes">
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m5 13 4 4L19 7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                {{ n.totalPages || '' }} pages of handwritten notes
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m5 13 4 4L19 7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Lifetime access in your library
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m5 13 4 4L19 7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Read on any device, secure viewer
              </li>
            </ul>
          </div>
        </div>

        <!-- reviews -->
        <div class="reviews">
          <h2 style="font-size:var(--t-24);font-weight:800;">Reviews</h2>
          <div class="card rev-summary" style="margin-top:14px;">
            <div style="text-align:center;">
              <div class="rev-big">{{ (n.averageRating || 0).toFixed(1) }}</div>
              <div class="stars" style="--st:16px">
                @for (f of starArr(); track $index) {
                  <svg [class.empty]="!f" viewBox="0 0 24 24" fill="currentColor">
                    <path d="m12 2 2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.6 6.1 20.6l1.3-6.5L2.5 8.9l6.6-.8L12 2Z" />
                  </svg>
                }
              </div>
              <div class="rating-count" style="margin-top:6px;">{{ n.reviewCount || 0 }} reviews</div>
            </div>
          </div>

          @if (canReview()) {
            <div class="card write-review">
              <h4 style="font-size:var(--t-16);margin-bottom:6px;">Write a review</h4>
              <p class="muted" style="font-size:var(--t-14);margin:0 0 14px;">
                You purchased this note — share your experience.
              </p>
              <div class="stars" style="--st:26px;margin-bottom:12px;cursor:pointer;">
                @for (i of [1, 2, 3, 4, 5]; track i) {
                  <svg [class.empty]="i > myRating()" (click)="myRating.set(i)" viewBox="0 0 24 24" fill="currentColor">
                    <path d="m12 2 2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.6 6.1 20.6l1.3-6.5L2.5 8.9l6.6-.8L12 2Z" />
                  </svg>
                }
              </div>
              <textarea
                class="textarea"
                placeholder="What did you think of these notes?"
                [value]="myComment()"
                (input)="myComment.set($any($event.target).value)"
              ></textarea>
              <div style="margin-top:14px;">
                <button
                  class="btn btn-primary"
                  [attr.data-loading]="submitting() ? '1' : null"
                  (click)="submitReview()"
                >
                  <span class="btn-spin"></span><span>Submit review</span>
                </button>
              </div>
            </div>
          }

          <div class="rev-list">
            @for (r of reviews(); track r.id) {
              <div class="rev-item card">
                <div class="rev-top">
                  <span class="avatar avatar-sm">{{ initials(r.buyerName) }}</span>
                  <span class="rev-name">{{ r.buyerName || 'Student' }}</span>
                  <time>{{ r.createdAt | date: 'd MMM y' }}</time>
                </div>
                <div class="stars" style="--st:15px;margin-top:8px;">
                  @for (i of [1, 2, 3, 4, 5]; track i) {
                    <svg [class.empty]="i > r.rating" viewBox="0 0 24 24" fill="currentColor">
                      <path d="m12 2 2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.6 6.1 20.6l1.3-6.5L2.5 8.9l6.6-.8L12 2Z" />
                    </svg>
                  }
                </div>
                <p class="rev-text">{{ r.comment }}</p>
              </div>
            } @empty {
              <p class="muted" style="font-size:var(--t-14);">
                No reviews yet — be the first to review after purchase.
              </p>
            }
          </div>
        </div>
      } @else {
        <div class="card empty">
          <h3>Note not found</h3>
          <p>This note may have been removed.</p>
          <a class="btn btn-primary" routerLink="/browse">Back to browse</a>
        </div>
      }
    }
  `,
})
export class NoteDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  protected note = signal<Note | null>(null);
  protected reviews = signal<Review[]>([]);
  protected loading = signal(true);
  protected purchasing = signal(false);
  protected submitting = signal(false);
  protected purchasedLocal = signal(false);
  protected myRating = signal(5);
  protected myComment = signal('');

  private id = Number(this.route.snapshot.paramMap.get('id'));

  protected isPurchased = computed(() => this.purchasedLocal() || !!this.note()?.isPurchased);
  protected canReview = computed(() => this.isPurchased());

  protected examLabel = computed(() => examLabel(this.note()?.examType));
  protected thumbBg = computed(() => subjectGradient(this.note()?.subject));
  protected glyph = computed(() => (this.note()?.subject ?? '?').charAt(0).toUpperCase());
  protected sellerInitials = computed(() => this.initials(this.note()?.seller?.fullName));
  protected starArr = computed(() => {
    const r = Math.round(this.note()?.averageRating ?? 0);
    return Array.from({ length: 5 }, (_, i) => i < r);
  });

  constructor() {
    this.api
      .getNote(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.note.set(r.data);
          this.loading.set(false);
        },
        error: () => {
          this.note.set(null);
          this.loading.set(false);
        },
      });
    this.api
      .getNoteReviews(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => this.reviews.set(r.data?.content ?? []),
        error: () => {},
      });
  }

  protected readonly initials = initials;

  protected buy() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.purchasing()) return;
    this.purchasing.set(true);
    this.api
      .purchaseNote(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.purchasing.set(false);
          this.purchasedLocal.set(true);
          this.toast.success('Purchase successful — happy studying!');
        },
        error: () => this.purchasing.set(false),
      });
  }

  protected submitReview() {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.api
      .submitReview(this.id, this.myRating(), this.myComment().trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.success('Thanks for your review!');
          this.myComment.set('');
          this.api
            .getNoteReviews(this.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: (r) => this.reviews.set(r.data?.content ?? []), error: () => {} });
        },
        error: () => this.submitting.set(false),
      });
  }
}
