import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { User } from '@core/models';
import { initials } from '@shared/util/note-display';

@Component({
  selector: 'app-admin-verifications',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <div>
        <div class="crumb">Admin</div>
        <h1>Verifications</h1>
        <p>{{ pending().length }} sellers awaiting review.</p>
      </div>
    </div>

    @if (loading()) {
      <div class="skel" style="height:240px;border-radius:12px"></div>
    } @else if (pending().length === 0) {
      <div class="card empty">
        <div class="e-ic" style="background:var(--success-bg);color:var(--success);">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path
              d="m5 13 4 4L19 7"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h3>No pending verifications 🎉</h3>
        <p>You're all caught up. New seller submissions will appear here.</p>
      </div>
    } @else {
      <div class="verif-cards">
        @for (p of pending(); track p.id) {
          <div class="card verif-review">
            <div class="vr-top">
              <span class="avatar avatar-lg">{{ initials(p.fullName) }}</span>
              <div style="flex:1;">
                <h4 style="font-size:var(--t-16);">{{ p.fullName }}</h4>
                <div class="muted" style="font-size:13px;">{{ p.institution }}</div>
                @if (p.classLevel) {
                  <div style="margin-top:6px;">
                    <span class="badge badge-amber">★ {{ p.classLevel }}</span>
                  </div>
                }
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
              <span class="badge badge-success"
                ><svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m5 13 4 4L19 7"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Test passed · {{ p.testScore }}%</span
              >
            </div>
            <div class="marksheet-thumb"><span class="muted" style="font-size:12px;">Marksheet</span></div>
            <div style="display:flex;gap:10px;margin-top:16px;">
              <button class="btn btn-danger btn-block" (click)="openReject(p)">Reject</button>
              <button
                class="btn btn-block"
                style="background:var(--success);color:#fff;"
                [attr.data-loading]="busyId() === p.id ? '1' : null"
                (click)="approve(p)"
              >
                <span class="btn-spin"></span><span>Approve</span>
              </button>
            </div>
          </div>
        }
      </div>
    }

    <!-- Reject modal -->
    <div class="modal-scrim" [class.open]="rejecting()">
      <div class="modal">
        <div class="modal-head">
          <h3>Reject verification</h3>
          <button class="x-btn" (click)="rejecting.set(null)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="slate" style="font-size:14px;margin:0 0 16px;">
            Rejecting <b>{{ rejecting()?.fullName }}</b
            >. Provide a reason — they'll see this and can re-submit.
          </p>
          <div class="field" [class.invalid]="reasonError()">
            <label class="label" for="rej-reason">Reason for rejection</label
            ><textarea
              id="rej-reason"
              class="textarea"
              [value]="reason()"
              (input)="reason.set($any($event.target).value)"
              placeholder="e.g. Marksheet image is blurry / details don't match…"
            ></textarea>
            <div class="field-err">A reason is required.</div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-secondary" (click)="rejecting.set(null)">Cancel</button
          ><button class="btn btn-danger" (click)="confirmReject()">Reject seller</button>
        </div>
      </div>
    </div>
  `,
})
export class AdminVerificationsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  protected pending = signal<User[]>([]);
  protected loading = signal(true);
  protected busyId = signal<number | null>(null);
  protected rejecting = signal<User | null>(null);
  protected reason = signal('');
  protected reasonError = signal(false);

  constructor() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.api
      .getPendingVerifications(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.pending.set(r.data?.content ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected approve(p: User) {
    this.busyId.set(p.id);
    this.api
      .approveSeller(p.id, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busyId.set(null);
          this.toast.success(`${p.fullName} approved`);
          this.remove(p.id);
        },
        error: () => this.busyId.set(null),
      });
  }

  protected openReject(p: User) {
    this.rejecting.set(p);
    this.reason.set('');
    this.reasonError.set(false);
  }

  protected confirmReject() {
    const p = this.rejecting();
    if (!p) return;
    if (!this.reason().trim()) {
      this.reasonError.set(true);
      return;
    }
    this.api
      .approveSeller(p.id, false, this.reason().trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success(`${p.fullName} rejected`);
          this.rejecting.set(null);
          this.remove(p.id);
        },
        error: () => {},
      });
  }

  private remove(id: number) {
    this.pending.update((list) => list.filter((x) => x.id !== id));
  }

  protected readonly initials = initials;
}
