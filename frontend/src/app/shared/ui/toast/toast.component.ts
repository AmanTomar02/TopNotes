import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '@core/services/toast.service';

/** Global toast outlet — mount once at the app root. Uses the design's .toast-stack/.toast classes. */
@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="toast"
          role="status"
          [class.toast-success]="t.type === 'success'"
          [class.toast-danger]="t.type === 'danger'"
        >
          <span class="t-ic">
            @switch (t.type) {
              @case ('success') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m5 13 4 4L19 7"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              }
              @case ('danger') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
                </svg>
              }
              @default {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
                  <path d="M12 11v5m0-8.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
              }
            }
          </span>
          <span>{{ t.message }}</span>
          <button type="button" class="t-close" aria-label="Dismiss notification" (click)="toast.dismiss(t.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast {
        align-items: center;
      }
      .t-close {
        margin-left: 6px;
        color: rgba(255, 255, 255, 0.5);
        display: grid;
        place-items: center;
        border-radius: 6px;
      }
      .t-close:hover {
        color: #fff;
      }
    `,
  ],
})
export class ToastComponent {
  protected toast = inject(ToastService);
}
