import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from '@core/services/confirm.service';

/** Global confirmation dialog outlet — mount once at the app root. */
@Component({
  selector: 'app-confirm',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="modal-scrim"
      [class.open]="state().open"
      role="button"
      tabindex="0"
      aria-label="Dismiss dialog"
      (click)="cancel($event)"
      (keydown.enter)="confirm.respond(false)"
    >
      <div class="modal" style="max-width:420px;" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>{{ state().title }}</h3>
        </div>
        <div class="modal-body">
          <p class="slate" style="font-size:14px;margin:0;line-height:1.55;">{{ state().message }}</p>
        </div>
        <div class="modal-foot">
          <button class="btn btn-secondary" (click)="confirm.respond(false)">Cancel</button>
          <button
            class="btn"
            [class.btn-danger]="state().danger"
            [class.btn-primary]="!state().danger"
            (click)="confirm.respond(true)"
          >
            {{ state().confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  protected confirm = inject(ConfirmService);
  protected state = this.confirm.state;

  @HostListener('document:keydown.escape')
  protected onEscape() {
    if (this.state().open) this.confirm.respond(false);
  }

  protected cancel(e: Event) {
    if ((e.target as HTMLElement).classList.contains('modal-scrim')) this.confirm.respond(false);
  }
}
