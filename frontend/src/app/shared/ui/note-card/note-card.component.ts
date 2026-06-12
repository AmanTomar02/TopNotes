import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Note } from '@core/models';
import { examLabel, initials, rupee, subjectGradient } from '@shared/util/note-display';

/** Reusable marketplace note card — maps a backend Note to the design's .note-card. */
@Component({
  selector: 'app-note-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <a class="note-card" [routerLink]="['/notes', note().id]">
      <div class="thumb" [style.height.px]="168" [style.background]="thumbBg()">
        @if (note().thumbnailUrl) {
          <img class="thumb-img" [src]="note().thumbnailUrl" [alt]="note().title" loading="lazy" />
        } @else {
          <span class="thumb-sub">{{ note().subject }}</span>
          <span class="thumb-glyph">{{ glyph() }}</span>
        }
      </div>
      <div class="nc-body">
        <div class="nc-badges">
          @if (note().subject) {
            <span class="badge badge-indigo">{{ note().subject }}</span>
          }
          @if (note().examType) {
            <span class="badge badge-amber">{{ examLabel() }}</span>
          }
        </div>
        <h3 class="nc-title">{{ note().title }}</h3>
        <div class="nc-seller">
          <span class="avatar avatar-sm">{{ sellerInitials() }}</span>
          <span class="nc-seller-name">{{ note().seller?.fullName }}</span>
          <span class="nc-verified" title="Verified topper">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
          </span>
        </div>
        <div class="nc-meta">
          <span class="stars">
            @for (f of starArr(); track $index) {
              <svg [class.empty]="!f" viewBox="0 0 24 24" fill="currentColor">
                <path d="m12 2 2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.6 6.1 20.6l1.3-6.5L2.5 8.9l6.6-.8L12 2Z" />
              </svg>
            }
          </span>
          <span class="rating-text">{{ ratingText() }}</span>
          <span class="rating-count">({{ note().reviewCount || 0 }})</span>
          @if (note().totalPages) {
            <span class="nc-dot">·</span>
            <span class="rating-count">{{ note().totalPages }} pages</span>
          }
        </div>
        <div class="nc-foot">
          <span class="nc-price">{{ price() }}</span>
          <span class="btn btn-primary btn-sm">View</span>
        </div>
      </div>
    </a>
  `,
})
export class NoteCardComponent {
  note = input.required<Note>();

  protected thumbBg = computed(() => subjectGradient(this.note().subject));
  protected glyph = computed(() => (this.note().subject ?? '?').charAt(0).toUpperCase());
  protected examLabel = computed(() => examLabel(this.note().examType));
  protected sellerInitials = computed(() => initials(this.note().seller?.fullName));
  protected ratingText = computed(() => (this.note().averageRating ?? 0).toFixed(1));
  protected starArr = computed(() => {
    const r = Math.round(this.note().averageRating ?? 0);
    return Array.from({ length: 5 }, (_, i) => i < r);
  });
  protected price = computed(() => rupee(this.note().price));
}
