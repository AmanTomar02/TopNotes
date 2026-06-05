import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmService } from '@core/services/confirm.service';
import { TestConfig, TestQuestionAdmin } from '@core/models';

const KEYS = ['A', 'B', 'C', 'D'];

@Component({
  selector: 'app-admin-test-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <div>
        <div class="crumb">Admin</div>
        <h1>Test manager</h1>
        <p>Configure the seller qualification test.</p>
      </div>
    </div>

    <div class="tabs" style="margin-bottom:24px;">
      <button class="tab" [attr.aria-selected]="tab() === 'config'" (click)="tab.set('config')">Test Config</button>
      <button class="tab" [attr.aria-selected]="tab() === 'questions'" (click)="tab.set('questions')">Questions</button>
      <button class="tab" [attr.aria-selected]="tab() === 'preview'" (click)="tab.set('preview')">
        Seller Preview
      </button>
    </div>

    @switch (tab()) {
      @case ('config') {
        <div class="card card-pad" style="max-width:620px;">
          <div class="config-row">
            <div>
              <div class="cr-label">Pass score</div>
              <div class="cr-help">Minimum percentage a seller must score to pass.</div>
            </div>
            <div class="cr-control">
              <div style="display:flex;align-items:center;gap:8px;">
                <input
                  class="input"
                  type="number"
                  [value]="passScore()"
                  (input)="passScore.set(+$any($event.target).value)"
                  style="width:90px;"
                /><span class="slate">%</span>
              </div>
            </div>
          </div>
          <div class="config-row">
            <div>
              <div class="cr-label">Time limit</div>
              <div class="cr-help">Total time allowed to complete the test.</div>
            </div>
            <div class="cr-control">
              <div style="display:flex;align-items:center;gap:8px;">
                <input
                  class="input"
                  type="number"
                  [value]="timeLimit()"
                  (input)="timeLimit.set(+$any($event.target).value)"
                  style="width:90px;"
                /><span class="slate">min</span>
              </div>
            </div>
          </div>
          <div class="config-row">
            <div>
              <div class="cr-label">Questions per test</div>
              <div class="cr-help">Randomly drawn from the active question pool.</div>
            </div>
            <div class="cr-control">
              <input
                class="input"
                type="number"
                [value]="perTest()"
                (input)="perTest.set(+$any($event.target).value)"
                style="width:90px;"
              />
            </div>
          </div>
          <div class="config-row">
            <div>
              <div class="cr-label">Shuffle questions</div>
              <div class="cr-help">Randomise question order for each attempt.</div>
            </div>
            <div class="cr-control" style="min-width:auto;">
              <button
                class="tn-toggle"
                role="switch"
                [attr.aria-checked]="shuffleQ()"
                (click)="shuffleQ.set(!shuffleQ())"
              >
                <span class="kn"></span>
              </button>
            </div>
          </div>
          <div class="config-row">
            <div>
              <div class="cr-label">Shuffle options</div>
              <div class="cr-help">Randomise A–D answer order.</div>
            </div>
            <div class="cr-control" style="min-width:auto;">
              <button
                class="tn-toggle"
                role="switch"
                [attr.aria-checked]="shuffleO()"
                (click)="shuffleO.set(!shuffleO())"
              >
                <span class="kn"></span>
              </button>
            </div>
          </div>
          <div style="margin-top:20px;">
            <button class="btn btn-primary" [attr.data-loading]="savingCfg() ? '1' : null" (click)="saveConfig()">
              <span class="btn-spin"></span><span>Save changes</span>
            </button>
          </div>
        </div>
      }

      @case ('questions') {
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <span class="muted" style="font-size:14px;"
            >{{ questions().length }} questions · {{ activeCount() }} active</span
          >
          <button class="btn btn-primary" (click)="openAdd()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            Add question
          </button>
        </div>
        @if (loadingQ()) {
          <div class="skel" style="height:200px;border-radius:12px"></div>
        } @else {
          @for (q of questions(); track q.id; let i = $index) {
            <div class="card card-pad" style="display:flex;gap:14px;align-items:flex-start;margin-bottom:12px;">
              <span class="opt-key" style="margin-top:2px;">{{ i + 1 }}</span>
              <div style="flex:1;">
                <div style="font-weight:600;">{{ q.questionText }}</div>
                <div style="margin-top:8px;display:flex;gap:8px;align-items:center;">
                  @if (q.subject) {
                    <span class="badge badge-indigo">{{ q.subject }}</span>
                  }
                  <span class="muted" style="font-size:12px;">Correct: {{ q.correctAnswerKey }}</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;">
                <button class="tn-toggle" role="switch" [attr.aria-checked]="q.isActive" (click)="toggle(q)">
                  <span class="kn"></span>
                </button>
                <button
                  class="btn btn-ghost btn-sm btn-icon"
                  aria-label="Delete"
                  style="color:var(--danger);"
                  (click)="remove(q)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 7h14M9 7V5h6v2m-8 0 1 13h8l1-13"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          } @empty {
            <p class="muted">No questions yet — add the first one.</p>
          }
        }
      }

      @case ('preview') {
        <div class="card card-pad" style="max-width:620px;">
          <div class="badge badge-warning" style="margin-bottom:16px;">Seller view · correct answers hidden</div>
          @if (previewQ(); as q) {
            <div class="test-q" style="padding:0;border:none;box-shadow:none;">
              <div class="tq-num">
                QUESTION 1
                @if (q.subject) {
                  · {{ q.subject }}
                }
              </div>
              <div class="tq-text">{{ q.questionText }}</div>
              @for (o of q.options; track o.optionKey) {
                <label class="opt-row"
                  ><input type="radio" name="pv" /><span class="opt-key">{{ o.optionKey }}</span
                  ><span>{{ o.optionText }}</span></label
                >
              }
            </div>
          } @else {
            <p class="muted">No active questions to preview.</p>
          }
        </div>
      }
    }

    <!-- Add question modal -->
    <div class="modal-scrim" [class.open]="addOpen()">
      <div class="modal modal-lg">
        <div class="modal-head">
          <h3>Add question</h3>
          <button class="x-btn" (click)="addOpen.set(false)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="label" for="q-text">Question</label
            ><textarea
              id="q-text"
              class="textarea"
              [value]="nq.text()"
              (input)="nq.text.set($any($event.target).value)"
              placeholder="Type the question…"
            ></textarea>
          </div>
          <div class="field">
            <label class="label" for="q-subject">Subject</label
            ><select
              id="q-subject"
              class="select"
              [value]="nq.subject()"
              (change)="nq.subject.set($any($event.target).value)"
            >
              <option>Chemistry</option>
              <option>Physics</option>
              <option>Mathematics</option>
              <option>Biology</option>
              <option>General Knowledge</option>
            </select>
          </div>
          <div class="label">Options &amp; correct answer</div>
          @for (k of keys; track k; let i = $index) {
            <label class="opt-row" style="margin-bottom:8px;"
              ><input type="radio" name="correct" [checked]="nq.correct() === i" (change)="nq.correct.set(i)" /><span
                class="opt-key"
                >{{ k }}</span
              ><input
                class="input"
                style="border:none;box-shadow:none;height:auto;"
                [value]="nq.opts()[i]"
                (input)="setOpt(i, $any($event.target).value)"
                [attr.placeholder]="'Option ' + k"
            /></label>
          }
          <p class="field-hint">Select the radio next to the correct option.</p>
        </div>
        <div class="modal-foot">
          <button class="btn btn-secondary" (click)="addOpen.set(false)">Cancel</button
          ><button class="btn btn-primary" [attr.data-loading]="creating() ? '1' : null" (click)="create()">
            <span class="btn-spin"></span><span>Add question</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AdminTestManagerComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private destroyRef = inject(DestroyRef);

  protected readonly keys = KEYS;
  protected tab = signal<'config' | 'questions' | 'preview'>('config');

  // config
  private loadedCfg: TestConfig | null = null;
  protected passScore = signal(70);
  protected timeLimit = signal(30);
  protected perTest = signal(10);
  protected shuffleQ = signal(true);
  protected shuffleO = signal(false);
  protected savingCfg = signal(false);

  // questions
  protected questions = signal<TestQuestionAdmin[]>([]);
  protected loadingQ = signal(true);
  protected activeCount = computed(() => this.questions().filter((q) => q.isActive).length);
  protected previewQ = computed(() => this.questions().find((q) => q.isActive) ?? null);

  // add-question modal
  protected addOpen = signal(false);
  protected creating = signal(false);
  protected nq = { text: signal(''), subject: signal('Chemistry'), opts: signal(['', '', '', '']), correct: signal(0) };

  constructor() {
    this.api
      .getTestConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          const c = r.data;
          this.loadedCfg = c;
          if (c) {
            this.passScore.set(c.passScorePercent);
            this.timeLimit.set(c.timeLimitMinutes);
            this.perTest.set(c.questionsPerTest);
            this.shuffleQ.set(c.shuffleQuestions);
            this.shuffleO.set(c.shuffleOptions);
          }
        },
        error: () => {},
      });
    this.loadQuestions();
  }

  private loadQuestions() {
    this.loadingQ.set(true);
    this.api
      .getTestQuestions(undefined, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.questions.set(r.data?.content ?? []);
          this.loadingQ.set(false);
        },
        error: () => this.loadingQ.set(false),
      });
  }

  protected saveConfig() {
    this.savingCfg.set(true);
    const cfg: TestConfig = {
      ...(this.loadedCfg ?? ({ maxAttempts: 0, isActive: true } as TestConfig)),
      passScorePercent: this.passScore(),
      timeLimitMinutes: this.timeLimit(),
      questionsPerTest: this.perTest(),
      shuffleQuestions: this.shuffleQ(),
      shuffleOptions: this.shuffleO(),
      isActive: true,
    };
    this.api
      .updateTestConfig(cfg)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.loadedCfg = r.data;
          this.savingCfg.set(false);
          this.toast.success('Test config saved');
        },
        error: () => this.savingCfg.set(false),
      });
  }

  protected toggle(q: TestQuestionAdmin) {
    if (q.id == null) return;
    this.api
      .toggleTestQuestion(q.id, !q.isActive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.questions.update((list) => list.map((x) => (x.id === q.id ? { ...x, isActive: !x.isActive } : x))),
        error: () => {},
      });
  }

  protected async remove(q: TestQuestionAdmin) {
    if (q.id == null) return;
    const ok = await this.confirm.ask({
      title: 'Delete question?',
      message: 'This question will be removed from the pool.',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api
      .deleteTestQuestion(q.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Question deleted');
          this.questions.update((list) => list.filter((x) => x.id !== q.id));
        },
        error: () => {},
      });
  }

  protected openAdd() {
    this.nq.text.set('');
    this.nq.subject.set('Chemistry');
    this.nq.opts.set(['', '', '', '']);
    this.nq.correct.set(0);
    this.addOpen.set(true);
  }
  protected setOpt(i: number, v: string) {
    this.nq.opts.update((o) => o.map((x, idx) => (idx === i ? v : x)));
  }

  protected create() {
    if (!this.nq.text().trim() || this.nq.opts().some((o) => !o.trim())) {
      this.toast.error('Fill the question and all 4 options.');
      return;
    }
    this.creating.set(true);
    const correct = this.nq.correct();
    const req = {
      questionText: this.nq.text().trim(),
      subject: this.nq.subject(),
      displayOrder: this.questions().length + 1,
      isActive: true,
      correctAnswerKey: KEYS[correct],
      options: this.nq
        .opts()
        .map((text, i) => ({ optionKey: KEYS[i], optionText: text.trim(), isCorrect: i === correct })),
    };
    this.api
      .createTestQuestion(req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.addOpen.set(false);
          this.toast.success('Question added');
          this.loadQuestions();
        },
        error: () => this.creating.set(false),
      });
  }
}
