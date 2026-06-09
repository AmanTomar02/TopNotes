import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { Note } from '@core/models';
import { NoteCardComponent } from '@ui/note-card/note-card.component';

@Component({
  selector: 'app-upload-note',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NoteCardComponent, RouterLink],
  template: `
    <div class="page-head">
      <div>
        <div class="crumb">Seller</div>
        <h1>Upload a note</h1>
        <p>Add a new set of notes to the marketplace.</p>
      </div>
    </div>

    @if (!auth.isVerified()) {
      <div class="verify-banner">
        <span class="vb-ic"
          ><svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2.5 4 6v5c0 5 3.5 8 8 9.5 4.5-1.5 8-4.5 8-9.5V6l-8-3.5Z"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linejoin="round"
            />
            <path d="M12 8.5v4M12 16v.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg
        ></span>
        <div class="vb-body">
          <b>Verify your account to publish</b>
          <span>You can prepare your listing now, but publishing needs a one-time check — pass a short test and upload your marksheet.</span>
        </div>
        <a class="btn btn-primary" routerLink="/seller/verification">Get verified</a>
      </div>
    }

    <form class="upload-grid" [formGroup]="form" (ngSubmit)="publish()">
      <div>
        <div class="card form-section">
          <h3><span class="sec-num">1</span> Details</h3>
          <p class="sec-desc">Tell buyers what's inside.</p>
          <div class="field" [class.invalid]="invalid('title')">
            <label class="label" for="up-title">Title</label>
            <input
              id="up-title"
              class="input"
              formControlName="title"
              placeholder="e.g. Organic Chemistry — Reaction Mechanisms"
            />
            <div class="field-err">Title must be at least 5 characters.</div>
          </div>
          <div class="field" [class.invalid]="invalid('description')">
            <label class="label" for="up-desc">Description</label>
            <textarea
              id="up-desc"
              class="textarea"
              formControlName="description"
              placeholder="What topics are covered? What makes these notes useful? (min 20 characters)"
            ></textarea>
            <div class="field-err">Description must be at least 20 characters.</div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label class="label" for="up-class">Class</label
              ><select id="up-class" class="select" formControlName="classLevel">
                <option>Class 11</option>
                <option>Class 12</option>
              </select>
            </div>
            <div class="field">
              <label class="label" for="up-subject">Subject</label
              ><select id="up-subject" class="select" formControlName="subject">
                <option>Physics</option>
                <option>Chemistry</option>
                <option>Mathematics</option>
                <option>Biology</option>
              </select>
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label class="label" for="up-exam">Exam type</label
              ><select id="up-exam" class="select" formControlName="examType">
                <option value="JEE_MAIN">JEE Main</option>
                <option value="JEE_ADVANCED">JEE Advanced</option>
                <option value="NEET">NEET</option>
                <option value="BOARD">Board</option>
              </select>
            </div>
            <div class="field" [class.invalid]="invalid('price')">
              <label class="label" for="up-price">Price (₹)</label
              ><input id="up-price" class="input" type="number" formControlName="price" placeholder="199" />
              <div class="field-err">Set a price (₹1 or more).</div>
            </div>
          </div>
        </div>

        <div class="card form-section">
          <h3><span class="sec-num">2</span> Files</h3>
          <p class="sec-desc">Upload the notes PDF and an optional cover.</p>
          <input #pdfInput type="file" accept="application/pdf" hidden (change)="onPdf($any($event.target).files)" />
          <div
            class="dropzone"
            role="button"
            tabindex="0"
            [class.drag]="dragging()"
            (click)="pdfInput.click()"
            (keydown.enter)="pdfInput.click()"
            (dragover)="$event.preventDefault(); dragging.set(true)"
            (dragleave)="dragging.set(false)"
            (drop)="$event.preventDefault(); dragging.set(false); onPdf($any($event).dataTransfer.files)"
          >
            <div class="dz-ic">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 15V4m0 0L8 8m4-4 4 4"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <h4>Drag &amp; drop your PDF here</h4>
            <p>or click to browse · PDF only · max 50MB</p>
          </div>
          @if (pdfFile(); as f) {
            <div class="upload-file">
              <span class="uf-ic">PDF</span>
              <div class="uf-body">
                <div class="uf-name">{{ f.name }}</div>
                <div class="uf-pct">{{ (f.size / 1048576).toFixed(1) }} MB</div>
              </div>
              <button type="button" class="btn btn-ghost btn-sm" (click)="pdfFile.set(null)">Remove</button>
            </div>
          }
        </div>

        <div class="card form-section">
          <h3><span class="sec-num">3</span> Review &amp; publish</h3>
          <p class="sec-desc">Check the preview, then publish to the marketplace.</p>
          <button type="submit" class="btn btn-primary btn-lg" [attr.data-loading]="publishing() ? '1' : null">
            <span class="btn-spin"></span><span>Publish note</span>
          </button>
        </div>
      </div>

      <div class="preview-pane">
        <div class="pp-label">Live preview · how it appears in Browse</div>
        <app-note-card [note]="previewNote()" />
      </div>
    </form>
  `,
})
export class UploadNoteComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  protected auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected pdfFile = signal<File | null>(null);
  protected dragging = signal(false);
  protected publishing = signal(false);

  protected form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    classLevel: ['Class 12'],
    subject: ['Physics'],
    examType: ['JEE_MAIN'],
    price: [199, [Validators.required, Validators.min(1)]],
  });

  private formValue = signal(this.form.getRawValue());

  constructor() {
    // Pull the latest account state so the "verify to publish" banner reflects
    // an admin approval that may have happened mid-session (without a re-login).
    this.auth.refreshSession();
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formValue.set(this.form.getRawValue()));
  }

  protected previewNote = computed<Note>(() => {
    const v = this.formValue();
    return {
      id: 0,
      title: v.title || 'Your note title',
      description: v.description,
      classLevel: v.classLevel,
      subject: v.subject,
      examType: v.examType,
      price: Number(v.price) || 0,
      totalPages: 0,
      averageRating: 0,
      reviewCount: 0,
      seller: { id: 0, fullName: this.auth.user()?.fullName ?? 'You' },
    };
  });

  protected invalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected onPdf(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') {
      this.toast.error('Please choose a PDF file.');
      return;
    }
    if (f.size > 50 * 1048576) {
      this.toast.error('PDF must be under 50MB.');
      return;
    }
    this.pdfFile.set(f);
  }

  protected publish() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.pdfFile()) {
      this.toast.error('Please attach the notes PDF.');
      return;
    }
    if (this.publishing()) return;

    this.publishing.set(true);
    const fd = new FormData();
    fd.append('data', new Blob([JSON.stringify(this.form.getRawValue())], { type: 'application/json' }));
    fd.append('pdf', this.pdfFile()!);

    this.api
      .uploadNote(fd)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.publishing.set(false);
          this.toast.success('Note published to the marketplace 🎉');
          this.router.navigate(['/seller/notes']);
        },
        error: () => this.publishing.set(false),
      });
  }
}
