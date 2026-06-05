import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';

interface VerifQuestion {
  id: number;
  questionText: string;
  subject?: string;
  options: { optionKey: string; optionText: string }[];
}
type Stage = 'loading' | 'intro' | 'test' | 'result' | 'marksheet' | 'pending' | 'approved';

@Component({
  selector: 'app-verification',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (stage() === 'loading') {
      <div class="skel" style="height:300px;border-radius:12px;max-width:560px;margin:0 auto"></div>
    } @else {
      <!-- stepper -->
      <div class="stepper-top">
        <div class="step-node" [class.done]="step1Done()" [class.active]="!step1Done()">
          <span class="sn-dot">{{ step1Done() ? '✓' : '1' }}</span
          ><span class="sn-label">Academic test</span>
        </div>
        <div class="step-line" [class.done]="step1Done()"></div>
        <div class="step-node" [class.active]="step1Done()">
          <span class="sn-dot">2</span><span class="sn-label">Marksheet</span>
        </div>
      </div>

      @switch (stage()) {
        @case ('intro') {
          <div class="card card-pad" style="max-width:560px;margin:0 auto;">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
              <span
                style="width:48px;height:48px;border-radius:12px;background:var(--indigo-50);color:var(--indigo-700);display:grid;place-items:center;"
                ><svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.7" />
                  <path d="M8 8h5M8 12h8M8 16h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg
              ></span>
              <div>
                <h3 style="font-size:var(--t-20);">Step 1 — Academic test</h3>
                <p class="muted" style="font-size:14px;margin:2px 0 0;">
                  Prove your subject mastery to sell on TopNotes.
                </p>
              </div>
            </div>
            <ul class="pc-includes" style="margin:0 0 20px;">
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m5 13 4 4L19 7"
                    stroke="var(--success)"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Multiple-choice questions (A–D)
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m5 13 4 4L19 7"
                    stroke="var(--success)"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Pass mark: 70% or higher
              </li>
            </ul>
            <button
              class="btn btn-primary btn-lg btn-block"
              [attr.data-loading]="busy() ? '1' : null"
              (click)="startTest()"
            >
              <span class="btn-spin"></span><span>Start test</span>
            </button>
          </div>
        }

        @case ('test') {
          <div style="max-width:640px;margin:0 auto;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
              <span class="muted" style="font-size:14px;font-weight:600;"
                >{{ answeredCount() }} of {{ questions().length }} answered</span
              >
            </div>
            <div class="progress" style="margin-bottom:18px;"><i [style.width.%]="progress()"></i></div>
            @for (q of questions(); track q.id; let idx = $index) {
              <div class="card test-q">
                <div class="tq-num">
                  QUESTION {{ idx + 1 }}
                  @if (q.subject) {
                    · {{ q.subject }}
                  }
                </div>
                <div class="tq-text">{{ q.questionText }}</div>
                @for (o of q.options; track o.optionKey) {
                  <label class="opt-row"
                    ><input
                      type="radio"
                      [name]="'q' + q.id"
                      [checked]="answers()[q.id] === o.optionKey"
                      (change)="answer(q.id, o.optionKey)"
                    /><span class="opt-key">{{ o.optionKey }}</span
                    ><span>{{ o.optionText }}</span></label
                  >
                }
              </div>
            }
            <div style="display:flex;justify-content:flex-end;margin-top:18px;">
              <button
                class="btn btn-primary btn-lg"
                [disabled]="answeredCount() < questions().length"
                [attr.data-loading]="busy() ? '1' : null"
                (click)="submitTest()"
              >
                <span class="btn-spin"></span><span>Submit answers</span>
              </button>
            </div>
          </div>
        }

        @case ('result') {
          <div class="card result-hero" style="max-width:520px;margin:0 auto;">
            <div class="rh-ic" [class.pass]="passed()" [class.fail]="!passed()">
              @if (passed()) {
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m5 13 4 4L19 7"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              } @else {
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
                </svg>
              }
            </div>
            <h2 style="font-size:var(--t-24);">{{ passed() ? 'You passed!' : 'Not quite there' }}</h2>
            <div class="rh-score" [style.color]="passed() ? 'var(--success)' : 'var(--danger)'">{{ score() }}%</div>
            <p class="muted" style="max-width:360px;margin:8px auto 22px;">
              {{
                passed()
                  ? 'Great work — you scored above the 70% pass mark. Continue to upload your marksheet.'
                  : 'You scored below the 70% pass mark. You can retake the test.'
              }}
            </p>
            @if (passed()) {
              <button class="btn btn-primary btn-lg" (click)="stage.set('marksheet')">Continue to Step 2</button>
            } @else {
              <button class="btn btn-secondary btn-lg" (click)="stage.set('intro')">Retake test</button>
            }
          </div>
        }

        @case ('marksheet') {
          <div class="card card-pad" style="max-width:560px;margin:0 auto;">
            <h3 style="font-size:var(--t-20);margin-bottom:4px;">Upload your marksheet</h3>
            <p class="muted" style="font-size:14px;margin:0 0 18px;">
              Upload a clear photo of your exam result / rank card. Our team verifies it within 24–48 hours.
            </p>
            <input #ms type="file" accept="image/*" hidden (change)="onMarksheet($any($event.target).files)" />
            <div class="dropzone" role="button" tabindex="0" (click)="ms.click()" (keydown.enter)="ms.click()">
              <div class="dz-ic">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.7" />
                  <circle cx="9" cy="10" r="2" stroke="currentColor" stroke-width="1.7" />
                  <path d="m4 19 5-4 4 3 3-2 4 3" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                </svg>
              </div>
              <h4>{{ marksheetFile()?.name || 'Drop your marksheet image' }}</h4>
              <p>JPG or PNG · max 10MB</p>
            </div>
            <button
              class="btn btn-primary btn-lg btn-block"
              style="margin-top:18px;"
              [disabled]="!marksheetFile()"
              [attr.data-loading]="busy() ? '1' : null"
              (click)="submitMarksheet()"
            >
              <span class="btn-spin"></span><span>Submit for review</span>
            </button>
          </div>
        }

        @case ('pending') {
          <div class="card result-hero" style="max-width:520px;margin:0 auto;">
            <div class="rh-ic" style="background:var(--warning-bg);color:var(--warning);">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" />
                <path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
            </div>
            <h2 style="font-size:var(--t-24);">Awaiting admin approval</h2>
            <p class="muted" style="max-width:380px;margin:10px auto 0;">
              Your test passed and your marksheet is under review. We'll notify you within 24–48 hours.
            </p>
          </div>
        }

        @case ('approved') {
          <div class="card result-hero" style="max-width:520px;margin:0 auto;">
            <div class="rh-ic pass">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2.5 4 6v5c0 5 3.5 8 8 9.5 4.5-1.5 8-4.5 8-9.5V6l-8-3.5Z"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linejoin="round"
                />
                <path
                  d="m9 12 2 2 4-4.5"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <h2 style="font-size:var(--t-24);">You're a verified seller!</h2>
            <p class="muted" style="max-width:380px;margin:10px auto 0;">
              Your account is approved. You can now upload and sell notes on TopNotes.
            </p>
            <a class="btn btn-primary btn-lg" style="margin-top:22px;" routerLink="/seller/upload"
              >Upload your first note</a
            >
          </div>
        }
      }
    }
  `,
})
export class VerificationComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  protected stage = signal<Stage>('loading');
  protected questions = signal<VerifQuestion[]>([]);
  protected answers = signal<Record<number, string>>({});
  protected passed = signal(false);
  protected score = signal(0);
  protected busy = signal(false);
  protected marksheetFile = signal<File | null>(null);

  protected answeredCount = computed(() => Object.keys(this.answers()).length);
  protected progress = computed(() => {
    const n = this.questions().length;
    return n ? (this.answeredCount() / n) * 100 : 0;
  });
  protected step1Done = computed(() => ['marksheet', 'pending', 'approved'].includes(this.stage()));

  constructor() {
    this.loadStatus();
  }

  private loadStatus() {
    this.api
      .getVerificationStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          const s = r.data ?? {};
          if (s['isVerified']) this.stage.set('approved');
          else if (s['testPassed'] && s['marksheetUploaded']) this.stage.set('pending');
          else if (s['testPassed']) this.stage.set('marksheet');
          else this.stage.set('intro');
        },
        error: () => this.stage.set('intro'),
      });
  }

  protected startTest() {
    if (this.busy()) return;
    this.busy.set(true);
    this.api
      .getVerificationTest()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.questions.set((r.data ?? []) as unknown as VerifQuestion[]);
          this.answers.set({});
          this.busy.set(false);
          this.stage.set('test');
        },
        error: () => this.busy.set(false),
      });
  }

  protected answer(qId: number, key: string) {
    this.answers.update((a) => ({ ...a, [qId]: key }));
  }

  protected submitTest() {
    if (this.busy()) return;
    this.busy.set(true);
    this.api
      .submitVerificationTest(this.answers())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          const res = r.data ?? {};
          this.passed.set(!!res['passed']);
          this.score.set(Math.round(Number(res['score'] ?? 0)));
          this.busy.set(false);
          this.stage.set('result');
        },
        error: () => this.busy.set(false),
      });
  }

  protected onMarksheet(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      this.toast.error('Please choose an image (JPG/PNG).');
      return;
    }
    if (f.size > 10 * 1048576) {
      this.toast.error('Image must be under 10MB.');
      return;
    }
    this.marksheetFile.set(f);
  }

  protected submitMarksheet() {
    if (this.busy() || !this.marksheetFile()) return;
    this.busy.set(true);
    const fd = new FormData();
    fd.append('marksheet', this.marksheetFile()!);
    this.api
      .uploadMarksheet(fd)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.toast.success('Marksheet submitted for review');
          this.stage.set('pending');
        },
        error: () => this.busy.set(false),
      });
  }
}
