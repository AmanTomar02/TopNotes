import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { environment } from '@env/environment';

// ── Local interfaces ──────────────────────────────────────────────

interface TestConfig {
  id?: number;
  passScorePercent: number;
  timeLimitMinutes: number;
  maxAttempts: number;
  questionsPerTest: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  isActive: boolean;
  totalActiveQuestions?: number;
  updatedAt?: string;
}

interface OptionItem {
  id?: number;
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
}

interface TestQuestion {
  id?: number;
  questionText: string;
  subject: string;
  displayOrder: number;
  isActive: boolean;
  correctAnswerKey: string;
  options: OptionItem[];
  createdAt?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Default blank form values ─────────────────────────────────────

const blankQuestion = (): TestQuestion => ({
  questionText:   '',
  subject:        '',
  displayOrder:   0,
  isActive:       true,
  correctAnswerKey: 'A',
  options: [
    { optionKey: 'A', optionText: '', isCorrect: true  },
    { optionKey: 'B', optionText: '', isCorrect: false },
    { optionKey: 'C', optionText: '', isCorrect: false },
    { optionKey: 'D', optionText: '', isCorrect: false },
  ],
});

// ── Component ─────────────────────────────────────────────────────

@Component({
  selector: 'app-admin-test-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
<app-navbar></app-navbar>
<div class="page-shell">
<div class="container page-body">

  <!-- ── Page Header ── -->
  <div class="page-header">
    <div>
      <h2>Test Management</h2>
      <p>Configure the seller verification MCQ test — no code changes needed.</p>
    </div>
    <div class="header-actions">
      <button class="btn btn-teal" (click)="openCreate()">+ Add Question</button>
    </div>
  </div>

  <!-- ── TABS ── -->
  <div class="tab-row">
    <button class="tab" [class.active]="tab === 'config'"    (click)="tab='config'">⚙️ Test Config</button>
    <button class="tab" [class.active]="tab === 'questions'" (click)="tab='questions'">📋 Questions ({{ totalElements() }})</button>
    <button class="tab" [class.active]="tab === 'preview'"   (click)="tab='preview';loadPreview()">👁 Seller Preview</button>
  </div>

  <!-- ══════════════════════════════
       TAB: CONFIG
  ══════════════════════════════ -->
  @if (tab === 'config') {
    <div class="config-grid">

      <!-- Left: live summary -->
      <div class="config-summary">
        <h3>Current Settings</h3>
        @if (config()) {
          <div class="summary-item">
            <span class="si-label">Status</span>
            <span class="si-value" [style.color]="config()!.isActive ? 'var(--green)' : 'var(--red)'">
              {{ config()!.isActive ? '✅ Test Enabled' : '⛔ Test Disabled' }}
            </span>
          </div>
          <div class="summary-item">
            <span class="si-label">Pass Score</span>
            <span class="si-value">{{ config()!.passScorePercent }}%</span>
          </div>
          <div class="summary-item">
            <span class="si-label">Time Limit</span>
            <span class="si-value">{{ config()!.timeLimitMinutes === 0 ? 'No limit' : config()!.timeLimitMinutes + ' minutes' }}</span>
          </div>
          <div class="summary-item">
            <span class="si-label">Max Attempts</span>
            <span class="si-value">{{ config()!.maxAttempts === 0 ? 'Unlimited' : config()!.maxAttempts }}</span>
          </div>
          <div class="summary-item">
            <span class="si-label">Questions Per Test</span>
            <span class="si-value">{{ config()!.questionsPerTest }} of {{ config()!.totalActiveQuestions }} active</span>
          </div>
          <div class="summary-item">
            <span class="si-label">Shuffle Questions</span>
            <span class="si-value">{{ config()!.shuffleQuestions ? '✓ Yes' : '✗ No' }}</span>
          </div>
          <div class="summary-item">
            <span class="si-label">Shuffle Options</span>
            <span class="si-value">{{ config()!.shuffleOptions ? '✓ Yes' : '✗ No' }}</span>
          </div>
        }
      </div>

      <!-- Right: edit form -->
      <div class="config-form-card">
        <h3>Edit Configuration</h3>
        @if (configForm) {
          <div class="form-2col">
            <div class="form-group">
              <label class="form-label">Pass Score (%)</label>
              <input class="form-control" type="number" min="1" max="100"
                     [(ngModel)]="configForm.passScorePercent">
              <small class="hint">Minimum % to pass (1–100)</small>
            </div>
            <div class="form-group">
              <label class="form-label">Time Limit (minutes)</label>
              <input class="form-control" type="number" min="0" max="240"
                     [(ngModel)]="configForm.timeLimitMinutes">
              <small class="hint">0 = No time limit</small>
            </div>
            <div class="form-group">
              <label class="form-label">Max Attempts Per Seller</label>
              <input class="form-control" type="number" min="0"
                     [(ngModel)]="configForm.maxAttempts">
              <small class="hint">0 = Unlimited retakes</small>
            </div>
            <div class="form-group">
              <label class="form-label">Questions Per Test</label>
              <input class="form-control" type="number" min="1"
                     [(ngModel)]="configForm.questionsPerTest">
              <small class="hint">Picked randomly from active bank</small>
            </div>
          </div>

          <div class="toggle-row">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="configForm.shuffleQuestions">
              <span class="toggle-slider"></span>
              Shuffle question order per attempt
            </label>
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="configForm.shuffleOptions">
              <span class="toggle-slider"></span>
              Shuffle option order per attempt
            </label>
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="configForm.isActive">
              <span class="toggle-slider"></span>
              Test is required for seller verification
            </label>
          </div>

          <div style="display:flex;gap:.75rem;margin-top:1.25rem;flex-wrap:wrap">
            <button class="btn btn-primary" (click)="saveConfig()" [disabled]="saving()">
              {{ saving() ? 'Saving…' : 'Save Configuration' }}
            </button>
            @if (configSaved()) {
              <div class="alert alert-success" style="margin:0;padding:.45rem 1rem">✅ Saved!</div>
            }
          </div>
        }
      </div>
    </div>
  }

  <!-- ══════════════════════════════
       TAB: QUESTIONS
  ══════════════════════════════ -->
  @if (tab === 'questions') {
    <!-- Search bar -->
    <div class="search-bar-row">
      <input class="form-control search-input" placeholder="Search questions by text or subject…"
             [(ngModel)]="keyword" (ngModelChange)="onSearch()">
      <span class="question-count">{{ totalElements() }} questions</span>
    </div>

    @if (loading()) {
      <div class="spinner-wrap"><div class="spinner"></div></div>
    } @else if (questions().length === 0) {
      <div class="empty-state">
        <div class="icon">📭</div>
        <h3>No questions yet</h3>
        <p>Click "Add Question" to create your first question.</p>
        <button class="btn btn-primary" style="margin-top:1rem" (click)="openCreate()">+ Add Question</button>
      </div>
    } @else {
      <!-- Questions list -->
      <div class="questions-list">
        @for (q of questions(); track q.id) {
          <div class="question-row" [class.inactive]="!q.isActive">
            <div class="q-drag-handle">⋮⋮</div>
            <div class="q-order">{{ q.displayOrder }}</div>
            <div class="q-content">
              <div class="q-text">{{ q.questionText }}</div>
              <div class="q-meta">
                @if (q.subject) { <span class="badge badge-teal">{{ q.subject }}</span> }
                <span class="badge badge-gold">Correct: {{ q.correctAnswerKey }}</span>
                <span class="badge" [class]="q.isActive ? 'badge-green' : 'badge-red'">
                  {{ q.isActive ? 'Active' : 'Disabled' }}
                </span>
                <span style="font-size:.72rem;color:var(--ink-muted)">{{ q.options.length }} options</span>
              </div>
              <!-- Collapsed options preview -->
              <div class="options-preview">
                @for (o of q.options; track o.optionKey) {
                  <span class="option-chip" [class.correct]="o.isCorrect">
                    {{ o.optionKey }}. {{ o.optionText | slice:0:30 }}{{ o.optionText.length > 30 ? '…' : '' }}
                  </span>
                }
              </div>
            </div>
            <div class="q-actions">
              <button class="btn btn-outline btn-sm" (click)="openEdit(q)" title="Edit">✏️</button>
              <button class="btn btn-sm" [class]="q.isActive ? 'btn-outline' : 'btn-teal'"
                      (click)="toggleQuestion(q)" title="{{ q.isActive ? 'Disable' : 'Enable' }}">
                {{ q.isActive ? '⏸' : '▶️' }}
              </button>
              <button class="btn btn-danger btn-sm" (click)="confirmDelete(q)" title="Delete">🗑</button>
            </div>
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="pagination">
          <button class="page-btn" (click)="goToPage(currentPage()-1)" [disabled]="currentPage()===0">‹</button>
          @for (p of pageRange(); track p) {
            <button class="page-btn" [class.active]="p===currentPage()" (click)="goToPage(p)">{{ p+1 }}</button>
          }
          <button class="page-btn" (click)="goToPage(currentPage()+1)" [disabled]="currentPage()>=totalPages()-1">›</button>
        </div>
      }
    }
  }

  <!-- ══════════════════════════════
       TAB: SELLER PREVIEW
  ══════════════════════════════ -->
  @if (tab === 'preview') {
    <div class="preview-panel">
      <div class="preview-info">
        <span class="badge badge-teal">As seen by sellers (answers hidden)</span>
        @if (config()) {
          <span style="font-size:.82rem;color:var(--ink-muted)">
            {{ previewQuestions().length }} questions ·
            {{ config()!.timeLimitMinutes === 0 ? 'No time limit' : config()!.timeLimitMinutes + ' min' }} ·
            Pass: {{ config()!.passScorePercent }}%
          </span>
        }
      </div>
      @for (q of previewQuestions(); track q.id; let i = $index) {
        <div class="preview-question">
          <div class="pq-num">Question {{ i + 1 }}</div>
          <div class="pq-text">{{ q.questionText }}</div>
          @if (q.subject) {
            <div style="font-size:.75rem;color:var(--ink-muted);margin-bottom:.6rem">Subject: {{ q.subject }}</div>
          }
          <div class="pq-options">
            @for (o of q.options; track o.optionKey) {
              <div class="pq-option">
                <span class="pq-key">{{ o.optionKey }}</span>
                {{ o.optionText }}
              </div>
            }
          </div>
        </div>
      }
    </div>
  }

</div>
</div>

<!-- ══════════════════════════════════════════════════
     MODAL: Create / Edit Question
══════════════════════════════════════════════════ -->
@if (showModal()) {
  <div class="modal-backdrop" (click)="closeModal()">
    <div class="modal modal-lg" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>{{ editingQuestion()?.id ? 'Edit Question' : 'Add New Question' }}</h3>
        <button class="modal-close" (click)="closeModal()">✕</button>
      </div>

      @if (formQuestion()) {
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Question Text *</label>
            <textarea class="form-control" rows="3"
                      [(ngModel)]="formQuestion()!.questionText"
                      placeholder="Enter your question here…"></textarea>
          </div>

          <div class="form-2col">
            <div class="form-group">
              <label class="form-label">Subject / Category</label>
              <input class="form-control" [(ngModel)]="formQuestion()!.subject"
                     placeholder="e.g. Mathematics, Physics">
            </div>
            <div class="form-group">
              <label class="form-label">Display Order</label>
              <input class="form-control" type="number" min="1"
                     [(ngModel)]="formQuestion()!.displayOrder">
            </div>
          </div>

          <!-- Options -->
          <div class="options-editor">
            <div class="options-header">
              <label class="form-label">Answer Options *</label>
              <button class="btn btn-outline btn-sm" (click)="addOption()">+ Add Option</button>
            </div>

            @for (opt of formQuestion()!.options; track opt.optionKey; let oi = $index) {
              <div class="option-editor-row" [class.correct-row]="formQuestion()!.correctAnswerKey === opt.optionKey">
                <div class="opt-key-badge" [class.correct-key]="formQuestion()!.correctAnswerKey === opt.optionKey">
                  {{ opt.optionKey }}
                </div>
                <input class="form-control opt-text" [(ngModel)]="opt.optionText"
                       [placeholder]="'Option ' + opt.optionKey + ' text'">
                <label class="correct-radio" title="Mark as correct answer">
                  <input type="radio" [name]="'correct_' + formQuestion()!.questionText"
                         [value]="opt.optionKey"
                         [(ngModel)]="formQuestion()!.correctAnswerKey">
                  ✓ Correct
                </label>
                @if (formQuestion()!.options.length > 2) {
                  <button class="btn btn-danger btn-sm" (click)="removeOption(oi)" title="Remove option">✕</button>
                }
              </div>
            }
          </div>

          <div class="form-group" style="margin-top:1rem">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="formQuestion()!.isActive">
              <span class="toggle-slider"></span>
              Active (shown to sellers)
            </label>
          </div>

          @if (formError()) {
            <div class="alert alert-error">{{ formError() }}</div>
          }
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" (click)="saveQuestion()" [disabled]="saving()">
            {{ saving() ? 'Saving…' : (editingQuestion()?.id ? 'Update Question' : 'Create Question') }}
          </button>
        </div>
      }
    </div>
  </div>
}

<!-- Delete confirm modal -->
@if (deleteTarget()) {
  <div class="modal-backdrop" (click)="deleteTarget.set(null)">
    <div class="modal" (click)="$event.stopPropagation()" style="max-width:420px">
      <div class="modal-header">
        <h3>Delete Question</h3>
        <button class="modal-close" (click)="deleteTarget.set(null)">✕</button>
      </div>
      <div style="padding:1.5rem">
        <p>Are you sure you want to permanently delete this question?</p>
        <p style="font-style:italic;color:var(--ink-muted);margin-top:.5rem;font-size:.88rem">
          "{{ deleteTarget()?.questionText | slice:0:80 }}…"
        </p>
        <div style="display:flex;gap:.75rem;margin-top:1.5rem">
          <button class="btn btn-outline" (click)="deleteTarget.set(null)">Cancel</button>
          <button class="btn btn-danger" (click)="executeDelete()" [disabled]="saving()">
            {{ saving() ? 'Deleting…' : 'Yes, Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    .page-body  { padding: 1.75rem 0 4rem; }
    .page-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem; }
    .page-header h2 { font-size:1.5rem; }
    .page-header p  { color:var(--muted,#7c7a8e);font-size:.85rem;margin-top:.2rem; }

    /* Tabs */
    .tab-row { display:flex;gap:.35rem;margin-bottom:1.75rem;border-bottom:2px solid #e8e3d8;padding-bottom:0; }
    .tab { padding:.55rem 1.1rem;border-radius:8px 8px 0 0;font-size:.85rem;font-weight:600;color:#7c7a8e;background:none;border:none;cursor:pointer;transition:all .18s ease;margin-bottom:-2px; }
    .tab.active { background:#fff;color:#0c0b14;border:2px solid #e8e3d8;border-bottom-color:#fff; }

    /* Config tab */
    .config-grid { display:grid;grid-template-columns:260px 1fr;gap:1.5rem;align-items:start; }
    .config-summary { background:#fff;border-radius:16px;padding:1.4rem;box-shadow:0 2px 12px rgba(12,11,20,.07); }
    .config-summary h3 { font-size:1rem;margin-bottom:1rem; }
    .summary-item { display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid #f2efe8;font-size:.83rem; }
    .summary-item:last-child { border-bottom:none; }
    .si-label { color:#7c7a8e;font-weight:600; }
    .si-value  { font-weight:700; }
    .config-form-card { background:#fff;border-radius:16px;padding:1.5rem;box-shadow:0 2px 12px rgba(12,11,20,.07); }
    .config-form-card h3 { font-size:1rem;margin-bottom:1.1rem; }
    .form-2col { display:grid;grid-template-columns:1fr 1fr;gap:0 1.25rem; }
    .form-group { margin-bottom:.9rem; }
    .form-label { display:block;font-size:.75rem;font-weight:700;color:#3d3a52;margin-bottom:.3rem;letter-spacing:.02em; }
    .form-control { width:100%;padding:.55rem .85rem;border:1.5px solid #e4dfd5;border-radius:10px;font-family:inherit;font-size:.85rem;outline:none;transition:border-color .18s; }
    .form-control:focus { border-color:#1e6b6b; }
    .hint { display:block;font-size:.7rem;color:#7c7a8e;margin-top:.2rem; }
    .toggle-row { display:flex;flex-direction:column;gap:.6rem;margin-top:.6rem; }
    .toggle-label { display:flex;align-items:center;gap:.6rem;cursor:pointer;font-size:.85rem;font-weight:500; }
    .toggle-label input[type=checkbox] { display:none; }
    .toggle-slider { width:38px;height:20px;background:#e4dfd5;border-radius:10px;position:relative;transition:background .2s;flex-shrink:0; }
    .toggle-slider::after { content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;background:#fff;border-radius:50%;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.2); }
    .toggle-label input:checked ~ .toggle-slider { background:#1e6b6b; }
    .toggle-label input:checked ~ .toggle-slider::after { transform:translateX(18px); }

    /* Questions tab */
    .search-bar-row { display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem; }
    .search-input { flex:1;max-width:480px; }
    .question-count { font-size:.82rem;color:#7c7a8e; }
    .questions-list { display:flex;flex-direction:column;gap:.65rem; }
    .question-row { background:#fff;border-radius:14px;padding:1rem 1.1rem;box-shadow:0 2px 8px rgba(12,11,20,.06);display:flex;align-items:flex-start;gap:.85rem;transition:box-shadow .18s; }
    .question-row:hover { box-shadow:0 6px 24px rgba(12,11,20,.10); }
    .question-row.inactive { opacity:.6; }
    .q-drag-handle { color:#c8c6d4;font-size:1rem;cursor:grab;padding-top:.1rem;flex-shrink:0; }
    .q-order { width:28px;height:28px;border-radius:50%;background:#f2efe8;color:#3d3a52;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0;margin-top:.05rem; }
    .q-content { flex:1;min-width:0; }
    .q-text { font-weight:600;font-size:.9rem;margin-bottom:.4rem;line-height:1.4; }
    .q-meta { display:flex;flex-wrap:wrap;gap:.3rem;align-items:center;margin-bottom:.45rem; }
    .options-preview { display:flex;flex-wrap:wrap;gap:.3rem; }
    .option-chip { font-size:.72rem;padding:.18rem .55rem;border-radius:6px;background:#f2efe8;color:#3d3a52; }
    .option-chip.correct { background:#d4f0e3;color:#145e36;font-weight:700; }
    .q-actions { display:flex;gap:.4rem;flex-shrink:0;align-items:flex-start;padding-top:.1rem; }

    /* Badge helpers */
    .badge { display:inline-flex;align-items:center;padding:.18rem .6rem;border-radius:100px;font-size:.68rem;font-weight:700; }
    .badge-teal  { background:#e3f4f4;color:#1e6b6b; }
    .badge-gold  { background:#fef3cd;color:#7a5c10; }
    .badge-green { background:#d4f0e3;color:#145e36; }
    .badge-red   { background:#fde8e7;color:#8b1f16; }

    /* Pagination */
    .pagination { display:flex;gap:.35rem;justify-content:center;margin-top:1.75rem; }
    .page-btn { width:34px;height:34px;border-radius:8px;border:1.5px solid #e4dfd5;background:#fff;cursor:pointer;font-size:.85rem;font-family:inherit;color:#3d3a52;transition:all .18s; }
    .page-btn.active,.page-btn:hover { background:#0c0b14;color:#fff;border-color:#0c0b14; }

    /* Preview tab */
    .preview-panel { display:flex;flex-direction:column;gap:1rem; }
    .preview-info  { display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:.25rem; }
    .preview-question { background:#fff;border-radius:14px;padding:1.25rem;box-shadow:0 2px 8px rgba(12,11,20,.06); }
    .pq-num { font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7c7a8e;margin-bottom:.4rem; }
    .pq-text { font-weight:700;font-size:.95rem;margin-bottom:.85rem;line-height:1.45; }
    .pq-options { display:grid;grid-template-columns:1fr 1fr;gap:.4rem; }
    .pq-option { display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;border:1.5px solid #e4dfd5;border-radius:8px;font-size:.85rem; }
    .pq-key { width:22px;height:22px;border-radius:50%;background:#f2efe8;color:#3d3a52;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0; }

    /* Modal */
    .modal-backdrop { position:fixed;inset:0;background:rgba(12,11,20,.55);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1.5rem; }
    .modal { background:#fff;border-radius:22px;width:100%;max-width:560px;box-shadow:0 24px 64px rgba(12,11,20,.2);max-height:90vh;display:flex;flex-direction:column; }
    .modal-lg { max-width:700px; }
    .modal-header { display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #f2efe8; }
    .modal-header h3 { font-size:1.15rem; }
    .modal-close { background:none;border:none;font-size:1.1rem;cursor:pointer;color:#7c7a8e;transition:color .18s; }
    .modal-close:hover { color:#0c0b14; }
    .modal-body { padding:1.5rem;overflow-y:auto;flex:1; }
    .modal-footer { padding:1rem 1.5rem;border-top:1px solid #f2efe8;display:flex;gap:.75rem;justify-content:flex-end; }

    /* Options editor */
    .options-editor { margin-top:.5rem; }
    .options-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:.6rem; }
    .option-editor-row { display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;padding:.5rem .65rem;border-radius:8px;border:1.5px solid #e4dfd5;transition:border-color .18s; }
    .option-editor-row.correct-row { border-color:#1e6b6b;background:#e3f4f4; }
    .opt-key-badge { width:26px;height:26px;border-radius:50%;background:#f2efe8;color:#3d3a52;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0; }
    .opt-key-badge.correct-key { background:#1e6b6b;color:#fff; }
    .opt-text { flex:1;border:none;background:transparent;font-size:.85rem;font-family:inherit;outline:none; }
    .correct-radio { display:flex;align-items:center;gap:.3rem;font-size:.75rem;font-weight:700;color:#1e6b6b;flex-shrink:0;cursor:pointer;white-space:nowrap; }
    .correct-radio input[type=radio] { cursor:pointer;accent-color:#1e6b6b; }

    /* Alerts */
    .alert { padding:.7rem 1rem;border-radius:8px;font-size:.85rem; }
    .alert-error   { background:#fde8e7;color:#8b1f16;border:1px solid #f5c6c3; }
    .alert-success { background:#d4f0e3;color:#145e36;border:1px solid #a3d9bd; }

    /* Misc */
    .btn { display:inline-flex;align-items:center;gap:.4rem;padding:.5rem 1.2rem;border-radius:10px;font-size:.83rem;font-weight:600;transition:all .18s;cursor:pointer;border:none; }
    .btn-primary { background:#0c0b14;color:#fff; }
    .btn-primary:hover:not(:disabled) { background:#1e1c2e; }
    .btn-teal    { background:#1e6b6b;color:#fff; }
    .btn-teal:hover:not(:disabled) { background:#2a8f8f; }
    .btn-outline { background:transparent;border:1.5px solid #e4dfd5;color:#0c0b14; }
    .btn-outline:hover:not(:disabled) { border-color:#0c0b14;background:#0c0b14;color:#fff; }
    .btn-danger  { background:#c0392b;color:#fff; }
    .btn-sm { padding:.32rem .72rem;font-size:.76rem;border-radius:8px; }
    .btn:disabled { opacity:.5;cursor:not-allowed; }

    .spinner-wrap { display:flex;justify-content:center;padding:3rem; }
    .spinner { width:36px;height:36px;border:3px solid #e4dfd5;border-top-color:#1e6b6b;border-radius:50%;animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty-state { text-align:center;padding:4rem 2rem;color:#7c7a8e; }
    .empty-state .icon { font-size:3rem;margin-bottom:1rem; }
    .empty-state h3 { color:#3d3a52;margin-bottom:.5rem; }

    @media (max-width: 800px) {
      .config-grid { grid-template-columns:1fr; }
      .form-2col   { grid-template-columns:1fr; }
      .pq-options  { grid-template-columns:1fr; }
    }
  `]
})
export class AdminTestManagerComponent implements OnInit {

  // ── State signals ─────────────────────────────────────────
  tab            = 'config';
  config         = signal<TestConfig | null>(null);
  configForm: TestConfig | null = null;
  questions      = signal<TestQuestion[]>([]);
  previewQuestions = signal<TestQuestion[]>([]);
  loading        = signal(false);
  saving         = signal(false);
  configSaved    = signal(false);
  showModal      = signal(false);
  editingQuestion = signal<TestQuestion | null>(null);
  formQuestion   = signal<TestQuestion | null>(null);
  deleteTarget   = signal<TestQuestion | null>(null);
  formError      = signal('');
  totalElements  = signal(0);
  totalPages     = signal(0);
  currentPage    = signal(0);
  keyword        = '';
  private searchTimer: any;
  private base   = `${environment.apiUrl}/admin/test`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadConfig();
    this.loadQuestions();
  }

  // ── Config ────────────────────────────────────────────────

  loadConfig() {
    this.http.get<ApiResponse<TestConfig>>(`${this.base}/config`)
      .subscribe(res => {
        if (res.success) {
          this.config.set(res.data);
          this.configForm = { ...res.data };
        }
      });
  }

  saveConfig() {
    if (!this.configForm) return;
    this.saving.set(true);
    this.http.put<ApiResponse<TestConfig>>(`${this.base}/config`, this.configForm)
      .subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.config.set(res.data);
            this.configSaved.set(true);
            setTimeout(() => this.configSaved.set(false), 2500);
          }
        },
        error: () => this.saving.set(false)
      });
  }

  // ── Questions ─────────────────────────────────────────────

  loadQuestions(page = 0) {
    this.loading.set(true);
    const params: any = { page, size: 15 };
    if (this.keyword) params.keyword = this.keyword;
    this.http.get<ApiResponse<PageResponse<TestQuestion>>>(`${this.base}/questions`, { params })
      .subscribe(res => {
        this.loading.set(false);
        if (res.success) {
          this.questions.set(res.data.content);
          this.totalElements.set(res.data.totalElements);
          this.totalPages.set(res.data.totalPages);
          this.currentPage.set(res.data.number);
        }
      });
  }

  loadPreview() {
    this.http.get<ApiResponse<PageResponse<TestQuestion>>>(`${this.base}/questions`, { params: { page: 0, size: 50 } })
      .subscribe(res => {
        if (res.success) {
          // Strip isCorrect to simulate seller view
          const stripped = res.data.content
            .filter(q => q.isActive)
            .map(q => ({
              ...q,
              options: q.options.map(o => ({ ...o, isCorrect: false }))
            }));
          this.previewQuestions.set(stripped);
        }
      });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadQuestions(0), 350);
  }

  goToPage(p: number) {
    if (p < 0 || p >= this.totalPages()) return;
    this.loadQuestions(p);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  }

  pageRange(): number[] {
    const total = this.totalPages();
    const cur   = this.currentPage();
    const start = Math.max(0, cur - 2);
    const end   = Math.min(total, start + 5);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }

  // ── Modal ─────────────────────────────────────────────────

  openCreate() {
    this.editingQuestion.set(null);
    this.formQuestion.set(blankQuestion());
    this.formError.set('');
    this.showModal.set(true);
  }

  openEdit(q: TestQuestion) {
    this.editingQuestion.set(q);
    // Deep clone so we don't mutate the list
    this.formQuestion.set(JSON.parse(JSON.stringify(q)));
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingQuestion.set(null);
    this.formQuestion.set(null);
    this.formError.set('');
  }

  addOption() {
    const q = this.formQuestion();
    if (!q) return;
    if (q.options.length >= 6) return;
    const nextKey = String.fromCharCode(65 + q.options.length); // A, B, C…
    q.options.push({ optionKey: nextKey, optionText: '', isCorrect: false });
    this.formQuestion.set({ ...q });
  }

  removeOption(index: number) {
    const q = this.formQuestion();
    if (!q || q.options.length <= 2) return;
    q.options.splice(index, 1);
    // If removed option was correct, reset correctAnswerKey to first option
    if (!q.options.find(o => o.optionKey === q.correctAnswerKey)) {
      q.correctAnswerKey = q.options[0].optionKey;
    }
    this.formQuestion.set({ ...q });
  }

  saveQuestion() {
    const q = this.formQuestion();
    if (!q) return;

    // Validate
    if (!q.questionText.trim()) {
      this.formError.set('Question text is required');
      return;
    }
    if (q.options.some(o => !o.optionText.trim())) {
      this.formError.set('All option texts are required');
      return;
    }
    if (!q.correctAnswerKey) {
      this.formError.set('Please select the correct answer');
      return;
    }

    this.saving.set(true);
    this.formError.set('');

    // Build payload
    const payload = {
      questionText:     q.questionText,
      subject:          q.subject,
      displayOrder:     q.displayOrder || undefined,
      isActive:         q.isActive,
      correctAnswerKey: q.correctAnswerKey,
      options: q.options.map(o => ({
        optionKey:  o.optionKey,
        optionText: o.optionText
      }))
    };

    const isEdit = !!this.editingQuestion()?.id;
    const req$ = isEdit
      ? this.http.put<ApiResponse<TestQuestion>>(`${this.base}/questions/${this.editingQuestion()!.id}`, payload)
      : this.http.post<ApiResponse<TestQuestion>>(`${this.base}/questions`, payload);

    req$.subscribe({
      next: res => {
        this.saving.set(false);
        if (res.success) {
          this.closeModal();
          this.loadQuestions(this.currentPage());
          this.loadConfig(); // refresh active count
        }
      },
      error: err => {
        this.saving.set(false);
        this.formError.set(err?.error?.message || 'Failed to save question. Please try again.');
      }
    });
  }

  toggleQuestion(q: TestQuestion) {
    this.http.patch<ApiResponse<TestQuestion>>(
      `${this.base}/questions/${q.id}/toggle`,
      null,
      { params: { isActive: String(!q.isActive) } }
    ).subscribe(res => {
      if (res.success) this.loadQuestions(this.currentPage());
    });
  }

  confirmDelete(q: TestQuestion) {
    this.deleteTarget.set(q);
  }

  executeDelete() {
    const q = this.deleteTarget();
    if (!q) return;
    this.saving.set(true);
    this.http.delete<ApiResponse<void>>(`${this.base}/questions/${q.id}`)
      .subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.deleteTarget.set(null);
            this.loadQuestions(this.currentPage());
            this.loadConfig();
          }
        },
        error: () => this.saving.set(false)
      });
  }
}
