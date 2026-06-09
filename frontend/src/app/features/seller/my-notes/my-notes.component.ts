import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmService } from '@core/services/confirm.service';
import { Note } from '@core/models';
import { IllustrationComponent } from '@ui/illustration/illustration.component';
import { subjectGradientFlat } from '@shared/util/note-display';

@Component({
  selector: 'app-my-notes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IllustrationComponent],
  template: `
    <div class="page-head">
      <div>
        <div class="crumb">Seller</div>
        <h1>My notes</h1>
        <p>Manage your catalogue, pricing and visibility.</p>
      </div>
      <div class="head-actions">
        <a class="btn btn-primary" routerLink="/seller/upload"
          ><svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          Upload new</a
        >
      </div>
    </div>

    @if (loading()) {
      <div class="skel" style="height:240px;border-radius:12px"></div>
    } @else if (notes().length === 0) {
      <div class="card empty">
        <app-illustration name="study" />
        <h3>No notes yet</h3>
        <p>Upload your first note to start selling.</p>
        <a class="btn btn-primary" routerLink="/seller/upload">Upload a note</a>
      </div>
    } @else {
      <div class="table-wrap">
        <table class="tn">
          <thead>
            <tr>
              <th>Note</th>
              <th>Status</th>
              <th class="hide-mobile">Price</th>
              <th class="hide-mobile">Sales</th>
              <th class="hide-mobile">Rating</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (n of notes(); track n.id) {
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div
                      style="width:40px;height:50px;border-radius:6px;flex:none;"
                      [style.background]="thumbBg(n)"
                    ></div>
                    <div style="font-weight:700;">{{ n.title }}</div>
                  </div>
                </td>
                <td>
                  <span class="badge" [class]="'badge ' + statusBadge(n.status)">{{ statusLabel(n.status) }}</span>
                </td>
                <td class="hide-mobile">
                  <div class="price-edit">
                    <span>₹</span
                    ><input
                      type="number"
                      [value]="n.price"
                      #pi
                      (keyup.enter)="savePrice(n, pi.value)"
                      aria-label="Price"
                    /><button class="btn btn-ghost btn-sm" (click)="savePrice(n, pi.value)">Save</button>
                  </div>
                </td>
                <td class="hide-mobile">{{ n.purchaseCount || 0 }}</td>
                <td class="hide-mobile">{{ n.averageRating ? '★ ' + n.averageRating.toFixed(1) : '—' }}</td>
                <td>
                  <div class="tbl-actions">
                    @if (n.status !== 'DELETED') {
                      <button class="btn btn-ghost btn-sm" (click)="remove(n)">Delete</button>
                    } @else {
                      <span class="muted" style="font-size:13px;">Removed</span>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class MyNotesComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private destroyRef = inject(DestroyRef);

  protected notes = signal<Note[]>([]);
  protected loading = signal(true);

  constructor() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.api
      .getSellerNotes(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.notes.set(r.data?.content ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected savePrice(n: Note, value: string) {
    const price = Number(value);
    if (!price || price === n.price) return;
    this.api
      .updateNotePrice(n.id, price)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Price updated');
          this.notes.update((list) => list.map((x) => (x.id === n.id ? { ...x, price } : x)));
        },
        error: () => {},
      });
  }

  protected async remove(n: Note) {
    const ok = await this.confirm.ask({
      title: 'Delete note?',
      message: `"${n.title}" will be removed from the marketplace.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api
      .deleteNote(n.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Note deleted');
          this.load();
        },
        error: () => {},
      });
  }

  protected thumbBg(n: Note): string {
    return subjectGradientFlat(n.subject);
  }
  protected statusBadge(s?: string): string {
    return s === 'ACTIVE' ? 'badge-success' : s === 'INACTIVE' ? 'badge-warning' : 'badge-muted';
  }
  protected statusLabel(s?: string): string {
    return s === 'ACTIVE' ? 'Active' : s === 'INACTIVE' ? 'Draft' : 'Deleted';
  }
}
