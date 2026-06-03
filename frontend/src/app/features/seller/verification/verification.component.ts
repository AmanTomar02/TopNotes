import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ApiService } from '@core/services/api.service';

interface VerifStatus { testPassed: boolean; marksheetUploaded: boolean; isVerified: boolean; }
interface Question { id: number; questionText: string; subject?: string; options: { optionKey: string; optionText: string }[]; }

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  template: `
<app-navbar></app-navbar>
<div class="page-shell">
<div class="container" style="max-width:780px;padding-top:1.75rem;padding-bottom:4rem">

  <h2 style="font-size:1.5rem;margin-bottom:.4rem">Seller Verification</h2>
  <p style="color:var(--mu);font-size:.85rem;margin-bottom:2rem">Complete these steps to start selling your handwritten notes.</p>

  <!-- Step tracker -->
  <div class="steps">
    <div class="step">
      <div class="sn" [class.done]="status()?.testPassed" [class.active]="!status()?.testPassed">{{ status()?.testPassed ? '✓' : '1' }}</div>
      <span [class.done-lbl]="status()?.testPassed">Academic Test</span>
    </div>
    <div class="sline" [class.done]="status()?.testPassed"></div>
    <div class="step">
      <div class="sn" [class.done]="status()?.marksheetUploaded" [class.active]="status()?.testPassed && !status()?.marksheetUploaded">{{ status()?.marksheetUploaded ? '✓' : '2' }}</div>
      <span [class.done-lbl]="status()?.marksheetUploaded">Upload Marksheet</span>
    </div>
    <div class="sline" [class.done]="status()?.marksheetUploaded"></div>
    <div class="step">
      <div class="sn" [class.done]="status()?.isVerified" [class.active]="status()?.marksheetUploaded && !status()?.isVerified">{{ status()?.isVerified ? '✓' : '3' }}</div>
      <span [class.done-lbl]="status()?.isVerified">Admin Approval</span>
    </div>
  </div>

  <!-- ── STEP 1: Test ── -->
  @if (!status()?.testPassed) {
    <div class="vcard">
      <h3 style="font-size:1.1rem;margin-bottom:.4rem">Step 1: Academic Verification Test</h3>

      @if (!testStarted()) {
        <p style="color:var(--mu);font-size:.85rem;margin-bottom:1.25rem">
          Answer MCQ questions to verify your academic knowledge. You need {{ testConfig()?.passScorePercent || 70 }}% to pass.
          @if (testConfig()?.timeLimitMinutes) { Time limit: {{ testConfig()!.timeLimitMinutes }} min. }
          @if (testConfig()?.maxAttempts)      { Max attempts: {{ testConfig()!.maxAttempts }}. }
        </p>
        @if (loadingTest()) { <div class="sw"><div class="sp"></div></div> }
        @else {
          <button class="btn btn-primary btn-lg" (click)="startTest()">Start Test</button>
        }
      }

      @if (testStarted() && !testResult()) {
        <!-- Timer -->
        @if (timeLeft() > 0) {
          <div class="timer" [class.urgent]="timeLeft() <= 60">
            ⏱ {{ formatTime(timeLeft()) }}
          </div>
        }

        <div style="display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem">
          @for (q of questions(); track q.id; let i = $index) {
            <div class="qblock">
              <div class="qn">{{ i+1 }}</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:.9rem;margin-bottom:.75rem;line-height:1.45">{{ q.questionText }}</div>
                @if (q.subject) { <div style="font-size:.72rem;color:var(--mu);margin-bottom:.6rem">Subject: {{ q.subject }}</div> }
                <div class="opts">
                  @for (o of q.options; track o.optionKey) {
                    <label class="opt" [class.sel]="answers[q.id] === o.optionKey">
                      <input type="radio" [name]="'q'+q.id" [value]="o.optionKey" [(ngModel)]="answers[q.id]" style="display:none">
                      <span class="ok" [class.ok-sel]="answers[q.id] === o.optionKey">{{ o.optionKey }}</span>
                      {{ o.optionText }}
                    </label>
                  }
                </div>
              </div>
            </div>
          }
        </div>
        <button class="btn btn-primary btn-lg" (click)="submitTest()" [disabled]="submitting()">
          {{ submitting() ? 'Submitting…' : 'Submit Answers' }}
        </button>
      }

      @if (testResult()) {
        <div class="result" [class.pass]="testResult()!.passed" [class.fail]="!testResult()!.passed">
          <div class="result-score">{{ testResult()!.score }}%</div>
          <div style="font-weight:700;font-size:1rem;margin-bottom:.3rem">{{ testResult()!.passed ? 'Test Passed! 🎉' : 'Not Passed' }}</div>
          <div style="font-size:.85rem;opacity:.85">{{ testResult()!.message }}</div>
          @if (!testResult()!.passed) {
            <button class="btn btn-outline" style="margin-top:1rem;border-color:currentColor" (click)="reset()">Try Again</button>
          }
        </div>
      }
    </div>
  }

  <!-- ── STEP 2: Marksheet ── -->
  @if (status()?.testPassed && !status()?.marksheetUploaded) {
    <div class="vcard">
      <h3 style="font-size:1.1rem;margin-bottom:.4rem">Step 2: Upload Marksheet</h3>
      <p style="color:var(--mu);font-size:.85rem;margin-bottom:1.25rem">Upload your previous class marksheet. Only your Name and Roll Number will be visible to the admin — all other details will be blurred for privacy.</p>
      <div class="dropz" (click)="mInput.click()" [class.has]="msFile">
        @if (msFile) { <div style="font-size:.9rem;font-weight:600;color:var(--tl)">📄 {{ msFile.name }}</div> }
        @else { <div><div style="font-size:1.75rem;margin-bottom:.4rem">📤</div><strong>Click to upload marksheet</strong><br><span style="font-size:.78rem;color:var(--mu)">JPG, PNG — max 5MB</span></div> }
      </div>
      <input #mInput type="file" accept="image/*" style="display:none" (change)="onFile($event)">
      @if (uploadError()) { <div class="alert alert-error">{{ uploadError() }}</div> }
      <button class="btn btn-primary btn-lg" (click)="uploadMarksheet()" [disabled]="!msFile || uploading()">
        {{ uploading() ? 'Uploading…' : 'Upload Marksheet' }}
      </button>
    </div>
  }

  <!-- ── STEP 3: Waiting ── -->
  @if (status()?.marksheetUploaded && !status()?.isVerified) {
    <div class="vcard" style="text-align:center;padding:2.5rem">
      <div style="font-size:3rem;margin-bottom:1rem">⏳</div>
      <h3 style="font-size:1.1rem;margin-bottom:.5rem">Awaiting Admin Approval</h3>
      <p style="color:var(--mu);font-size:.85rem">Your marksheet has been submitted. Our team will review it within 1–2 business days. You'll receive an email and in-app notification when approved.</p>
    </div>
  }

  <!-- ── DONE ── -->
  @if (status()?.isVerified) {
    <div class="vcard" style="text-align:center;padding:2.5rem;background:linear-gradient(135deg,#d4f0e3,#e8faf0);border:1.5px solid #a3d9bd">
      <div style="font-size:3rem;margin-bottom:1rem">🎉</div>
      <h3 style="font-size:1.2rem;margin-bottom:.5rem">You're Verified!</h3>
      <p style="color:var(--mu);font-size:.88rem;margin-bottom:1.25rem">Your seller account is approved. Start uploading and earning from your notes!</p>
      <a routerLink="/seller/upload" class="btn btn-gold btn-lg">Upload Your First Note →</a>
    </div>
  }

</div>
</div>
  `,
  styles: [`
    .steps { display:flex; align-items:center; margin-bottom:2rem; }
    .step  { display:flex; flex-direction:column; align-items:center; gap:.3rem; }
    .sn    { width:36px; height:36px; border-radius:50%; border:2.5px solid var(--cr3); background:#fff; display:flex; align-items:center; justify-content:center; font-size:.82rem; font-weight:700; color:var(--mu); transition:all var(--t); }
    .sn.done   { background:var(--tl); border-color:var(--tl); color:#fff; }
    .sn.active { border-color:var(--ink); color:var(--ink); }
    .step span { font-size:.72rem; font-weight:600; color:var(--mu); white-space:nowrap; }
    .step span.done-lbl { color:var(--tl); }
    .sline { flex:1; height:2.5px; background:var(--cr3); margin:0 .6rem; margin-bottom:.8rem; transition:background .4s; }
    .sline.done { background:var(--tl); }

    .vcard { background:#fff; border-radius:18px; padding:1.5rem; box-shadow:var(--sh); margin-bottom:1.25rem; }

    .timer { display:inline-flex; align-items:center; gap:.4rem; padding:.35rem .85rem; border-radius:100px; background:var(--cr2); font-weight:700; font-size:.88rem; margin-bottom:1.1rem; border:1.5px solid var(--cr3); }
    .timer.urgent { background:#fde8e7; border-color:#f5c6c3; color:var(--rd); animation:pulse 1s ease infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }

    .qblock { display:flex; gap:.9rem; padding:1.1rem; border:1.5px solid var(--cr3); border-radius:14px; }
    .qn { width:28px; height:28px; border-radius:50%; background:var(--cr2); color:var(--ink3); display:flex; align-items:center; justify-content:center; font-size:.78rem; font-weight:700; flex-shrink:0; margin-top:.05rem; }
    .opts { display:grid; grid-template-columns:1fr 1fr; gap:.4rem; }
    .opt  { display:flex; align-items:center; gap:.5rem; padding:.5rem .75rem; border:1.5px solid var(--cr3); border-radius:9px; cursor:pointer; font-size:.84rem; transition:all var(--t); }
    .opt:hover { border-color:var(--tl); }
    .opt.sel   { border-color:var(--tl); background:var(--tlp); color:var(--tl); font-weight:600; }
    .ok  { width:22px; height:22px; border-radius:50%; background:var(--cr2); color:var(--ink3); display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700; flex-shrink:0; }
    .ok.ok-sel { background:var(--tl); color:#fff; }

    .result { border-radius:14px; padding:1.75rem; text-align:center; }
    .result.pass { background:linear-gradient(135deg,#d4f0e3,#e8faf0); color:#145e36; border:1.5px solid #a3d9bd; }
    .result.fail { background:linear-gradient(135deg,#fde8e7,#fdf2f1); color:#8b1f16; border:1.5px solid #f5c6c3; }
    .result-score { font-family:'Cormorant Garamond',serif; font-size:3rem; font-weight:700; margin-bottom:.4rem; }

    .dropz { border:2px dashed var(--cr3); border-radius:14px; padding:2.5rem; text-align:center; cursor:pointer; transition:all var(--t); margin-bottom:1.1rem; }
    .dropz:hover, .dropz.has { border-color:var(--tl); background:var(--tlp); }

    @media(max-width:600px) { .opts { grid-template-columns:1fr; } }
  `]
})
export class VerificationComponent implements OnInit {
  status     = signal<VerifStatus | null>(null);
  questions  = signal<Question[]>([]);
  testConfig = signal<any>(null);
  testStarted= signal(false);
  testResult = signal<any>(null);
  submitting = signal(false);
  loadingTest= signal(false);
  uploading  = signal(false);
  uploadError= signal('');
  answers: Record<number, string> = {};
  msFile: File | null = null;
  timeLeft = signal(0);
  private timerInterval: any;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getVerificationStatus().subscribe(r => { if (r.success) this.status.set(r.data); });
    this.api.getTestConfig().subscribe(r => { if (r.success) this.testConfig.set(r.data); });
  }

  startTest() {
    this.loadingTest.set(true);
    this.api.getVerificationTest().subscribe({
      next: r => {
        this.loadingTest.set(false);
        if (r.success) {
          this.questions.set(r.data);
          this.testStarted.set(true);
          // Start countdown if configured
          const mins = this.testConfig()?.timeLimitMinutes || 0;
          if (mins > 0) {
            this.timeLeft.set(mins * 60);
            this.timerInterval = setInterval(() => {
              this.timeLeft.update(t => { if (t <= 1) { clearInterval(this.timerInterval); this.submitTest(); return 0; } return t - 1; });
            }, 1000);
          }
        }
      },
      error: err => { this.loadingTest.set(false); alert(err?.error?.message || 'Could not load test.'); }
    });
  }

  submitTest() {
    clearInterval(this.timerInterval);
    this.submitting.set(true);
    this.api.submitVerificationTest(this.answers).subscribe({
      next: r => { this.submitting.set(false); if (r.success) { this.testResult.set(r.data); if (r.data.passed) this.status.update(s => s ? {...s, testPassed:true} : s); } },
      error: () => this.submitting.set(false)
    });
  }

  reset() { this.testStarted.set(false); this.testResult.set(null); this.answers = {}; this.timeLeft.set(0); }

  onFile(e: Event) { this.msFile = (e.target as HTMLInputElement).files?.[0] || null; }

  uploadMarksheet() {
    if (!this.msFile) return;
    this.uploading.set(true); this.uploadError.set('');
    const fd = new FormData(); fd.append('marksheet', this.msFile);
    this.api.uploadMarksheet(fd).subscribe({
      next: r => { this.uploading.set(false); if (r.success) this.status.update(s => s ? {...s, marksheetUploaded:true} : s); else this.uploadError.set(r.message); },
      error: err => { this.uploading.set(false); this.uploadError.set(err?.error?.message || 'Upload failed.'); }
    });
  }

  formatTime(s: number) { const m = Math.floor(s/60); const sec = s%60; return `${m}:${sec.toString().padStart(2,'0')}`; }
}
