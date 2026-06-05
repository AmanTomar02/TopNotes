import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import { Note, PageResponse } from '@core/models';
import { NoteCardComponent } from '@ui/note-card/note-card.component';

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
const CLASSES = ['Class 11', 'Class 12'];
const EXAMS = [
  { label: 'JEE Main', value: 'JEE_MAIN' },
  { label: 'JEE Advanced', value: 'JEE_ADVANCED' },
  { label: 'NEET', value: 'NEET' },
  { label: 'Board', value: 'BOARD' },
];
const PAGE_SIZE = 12;

@Component({
  selector: 'app-browse',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NoteCardComponent],
  template: `
    <div class="page-head">
      <div>
        <div class="crumb">Marketplace</div>
        <h1>Browse notes</h1>
        <p>Verified, handwritten notes from real toppers — for JEE, NEET &amp; Boards.</p>
      </div>
    </div>

    <div class="filter-bar">
      <button class="btn btn-secondary filter-toggle" (click)="filtersOpen.set(!filtersOpen())">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        Filters
      </button>
      @if (activeChips().length) {
        @for (c of activeChips(); track c) {
          <div class="chip active">{{ c }}</div>
        }
        <button class="chip" (click)="clearAll()">Clear all ✕</button>
      }
    </div>

    <div class="browse-layout">
      <aside class="filter-side" [class.open]="filtersOpen()" aria-label="Filters">
        <div class="filter-group">
          <h4>Class</h4>
          @for (c of classes; track c) {
            <label class="filter-opt"
              ><input
                type="checkbox"
                [checked]="classLevel() === c"
                (change)="patch({ classLevel: classLevel() === c ? null : c })"
              />
              {{ c }}</label
            >
          }
        </div>
        <div class="filter-group">
          <h4>Subject</h4>
          @for (s of subjects; track s) {
            <label class="filter-opt"
              ><input
                type="checkbox"
                [checked]="subject() === s"
                (change)="patch({ subject: subject() === s ? null : s })"
              />
              {{ s }}</label
            >
          }
        </div>
        <div class="filter-group">
          <h4>Exam type</h4>
          @for (e of exams; track e.value) {
            <label class="filter-opt"
              ><input
                type="checkbox"
                [checked]="examType() === e.value"
                (change)="patch({ examType: examType() === e.value ? null : e.value })"
              />
              {{ e.label }}</label
            >
          }
        </div>
      </aside>

      <div>
        <div class="result-row">
          <div class="result-count">
            @if (loading()) {
              Loading…
            } @else {
              <b>{{ total() }}</b> {{ total() === 1 ? 'note' : 'notes' }} found
            }
          </div>
          <select
            class="select"
            style="width:auto;height:40px;"
            [value]="sort()"
            (change)="patch({ sort: $any($event.target).value || null })"
          >
            <option value="">Sort: Most popular</option>
            <option value="rating">Highest rated</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        @if (loading()) {
          <div class="notes-grid">
            @for (s of skeletons; track s) {
              <div class="note-card">
                <div class="skel" style="height:168px;border-radius:0"></div>
                <div class="nc-body">
                  <div class="skel" style="height:14px;width:60%"></div>
                  <div class="skel" style="height:18px;width:90%"></div>
                  <div class="skel" style="height:14px;width:50%"></div>
                  <div class="skel" style="height:22px;width:40%;margin-top:8px"></div>
                </div>
              </div>
            }
          </div>
        } @else if (error()) {
          <div class="card empty">
            <h3>Couldn't load notes</h3>
            <p>Something went wrong. Please try again.</p>
            <button class="btn btn-primary" (click)="reload()">Retry</button>
          </div>
        } @else if (notes().length === 0) {
          <div class="card empty">
            <div class="e-ic">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.7" />
                <path d="m20 20-3.2-3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
            </div>
            <h3>No notes match your filters</h3>
            <p>Try clearing a filter or searching for a different topic.</p>
            <button class="btn btn-primary" (click)="clearAll()">Clear filters</button>
          </div>
        } @else {
          <div class="notes-grid">
            @for (n of notes(); track n.id) {
              <app-note-card [note]="n" />
            }
          </div>
          @if (totalPages() > 1) {
            <div style="display:flex;justify-content:center;margin-top:32px;">
              <div class="pager">
                <button [disabled]="page() === 0" (click)="patch({ page: page() - 1 })" aria-label="Previous">‹</button>
                @for (p of pageList(); track p) {
                  <button [attr.aria-current]="p === page() ? 'true' : null" (click)="patch({ page: p })">
                    {{ p + 1 }}
                  </button>
                }
                <button [disabled]="page() >= totalPages() - 1" (click)="patch({ page: page() + 1 })" aria-label="Next">
                  ›
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
      .filter-side.open {
        display: block;
      }
      @media (max-width: 920px) {
        .filter-side.open {
          display: block;
          margin-bottom: 16px;
        }
      }
    `,
  ],
})
export class BrowseComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected readonly subjects = SUBJECTS;
  protected readonly classes = CLASSES;
  protected readonly exams = EXAMS;
  protected readonly skeletons = Array.from({ length: 8 });

  protected keyword = signal('');
  protected classLevel = signal('');
  protected subject = signal('');
  protected examType = signal('');
  protected sort = signal('');
  protected page = signal(0);

  protected notes = signal<Note[]>([]);
  protected total = signal(0);
  protected totalPages = signal(0);
  protected loading = signal(true);
  protected error = signal(false);
  protected filtersOpen = signal(false);

  private cache = new Map<string, PageResponse<Note>>();
  private req$ = new Subject<Record<string, string | number>>();

  constructor() {
    // Single request pipeline: switchMap cancels stale requests; cache short-circuits repeats.
    this.req$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(false);
        }),
        switchMap((params) => {
          const key = JSON.stringify(params);
          const cached = this.cache.get(key);
          if (cached) return of(cached);
          return this.api.getNotes(params).pipe(
            map((r) => r.data),
            tap((d) => this.cache.set(key, d)),
            catchError(() => {
              this.error.set(true);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        if (data) {
          this.notes.set(data.content ?? []);
          this.total.set(data.totalElements ?? 0);
          this.totalPages.set(data.totalPages ?? 0);
        }
        this.loading.set(false);
      });

    // URL is the source of truth — read filters from query params, then fetch.
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((q) => {
      this.keyword.set(q['keyword'] ?? '');
      this.classLevel.set(q['classLevel'] ?? '');
      this.subject.set(q['subject'] ?? '');
      this.examType.set(q['examType'] ?? '');
      this.sort.set(q['sort'] ?? '');
      this.page.set(+(q['page'] ?? 0));
      this.req$.next(this.buildParams());
    });
  }

  /** Update the URL (merge); the queryParams subscription reloads. Resets page unless paging. */
  protected patch(changes: Params) {
    const resetPage = !('page' in changes);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: resetPage ? { ...changes, page: null } : changes,
      queryParamsHandling: 'merge',
    });
  }

  protected clearAll() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { classLevel: null, subject: null, examType: null, sort: null, page: null },
      queryParamsHandling: 'merge',
    });
  }

  protected reload() {
    this.req$.next(this.buildParams());
  }

  private buildParams(): Record<string, string | number> {
    const p: Record<string, string | number> = { page: this.page(), size: PAGE_SIZE };
    if (this.keyword()) p['keyword'] = this.keyword();
    if (this.classLevel()) p['classLevel'] = this.classLevel();
    if (this.subject()) p['subject'] = this.subject();
    if (this.examType()) p['examType'] = this.examType();
    if (this.sort()) p['sort'] = this.sort();
    return p;
  }

  protected activeChips(): string[] {
    const chips: string[] = [];
    if (this.classLevel()) chips.push(this.classLevel());
    if (this.subject()) chips.push(this.subject());
    if (this.examType()) chips.push(this.exams.find((e) => e.value === this.examType())?.label ?? this.examType());
    return chips;
  }

  protected pageList(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }
}
