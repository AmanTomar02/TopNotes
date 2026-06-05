import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { AuthShellComponent } from '../ui/auth-shell.component';
import { TextFieldComponent } from '@ui/text-field/text-field.component';
import { ButtonComponent } from '@ui/button/button.component';

type Role = 'student' | 'seller';

const STRENGTH = ['', 'Weak', 'Fair', 'Good', 'Strong'] as const;

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value;
  const c = group.get('confirm')?.value;
  return c && p !== c ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent, TextFieldComponent, ButtonComponent],
  styleUrls: ['../auth.css'],
  template: `
    <app-auth-shell>
      <div brand>
        <span class="eyebrow">★ Verified toppers only</span>
        <h2 class="brand-headline">Join the marketplace built on <em>real ranks.</em></h2>
        <p class="brand-sub">
          Whether you're studying for the next attempt or sharing the notes that got you there — start in under a
          minute.
        </p>
        <ul class="perks">
          <li>
            <span class="tick"
              ><svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2.5 7.5 5.5 10.5 11.5 3.5"
                  stroke="#F5A524"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg></span
            >Buy handwritten notes from verified rank-holders
          </li>
          <li>
            <span class="tick"
              ><svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2.5 7.5 5.5 10.5 11.5 3.5"
                  stroke="#F5A524"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg></span
            >Sellers earn on every download, every month
          </li>
          <li>
            <span class="tick"
              ><svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2.5 7.5 5.5 10.5 11.5 3.5"
                  stroke="#F5A524"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg></span
            >Subject-wise notes for JEE, NEET &amp; Boards
          </li>
        </ul>
      </div>

      <div card>
        <div class="steps" aria-hidden="true">
          <span class="step on"><span class="dot">1</span><span class="lbl">Choose role</span></span>
          <span class="seg" [class.on]="step() === 2"></span>
          <span class="step" [class.on]="step() === 2"
            ><span class="dot">2</span><span class="lbl">Your details</span></span
          >
        </div>

        @if (step() === 1) {
          <div class="card-head">
            <h1>Create your account</h1>
            <p>First, tell us how you'll use TopNotes.</p>
          </div>

          <div class="roles" role="radiogroup" aria-label="Account type">
            <label class="role student">
              <input
                type="radio"
                name="role"
                value="student"
                [checked]="role() === 'student'"
                (change)="role.set('student')"
              />
              <span class="role-ic" aria-hidden="true"
                ><svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3 1.5 8 12 13l8.5-4.05V14"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M6 10.5V15c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /></svg
              ></span>
              <span class="role-txt"
                ><h3>I'm a Student (Buyer)</h3>
                <p>Browse and buy verified notes to ace your exams.</p></span
              >
              <span class="role-check" aria-hidden="true"
                ><svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7.5 5.5 10.5 11.5 3.5"
                    stroke="#fff"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /></svg
              ></span>
            </label>

            <label class="role seller">
              <input
                type="radio"
                name="role"
                value="seller"
                [checked]="role() === 'seller'"
                (change)="role.set('seller')"
              />
              <span class="role-ic" aria-hidden="true"
                ><svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m12 3 2.6 5.27 5.82.85-4.21 4.1.99 5.78L12 16.77 6.8 19l1-5.78-4.22-4.1 5.82-.85L12 3Z"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linejoin="round"
                  /></svg
              ></span>
              <span class="role-txt"
                ><h3>I'm a Topper (Seller)</h3>
                <p>Upload your handwritten notes and earn from your rank.</p></span
              >
              <span class="role-check" aria-hidden="true"
                ><svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7.5 5.5 10.5 11.5 3.5"
                    stroke="#fff"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /></svg
              ></span>
            </label>
          </div>

          <div style="margin-top:24px">
            <app-button [block]="true" [disabled]="!role()" (clicked)="step.set(2)">Continue</app-button>
          </div>
          <p class="signup" style="margin-top:22px">
            Already have an account? <a class="link" routerLink="/login">Log in</a>
          </p>
        }

        @if (step() === 2) {
          <button type="button" class="back-btn" (click)="step.set(1)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3 5 8l5 5"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Back
          </button>

          <div class="card-head" style="margin-top:10px">
            <h1>Your details</h1>
            <p>Set up your {{ role() === 'seller' ? 'seller' : 'student' }} credentials.</p>
          </div>

          <div class="role-pill" [class.seller]="role() === 'seller'">
            <span class="mini" aria-hidden="true"
              ><svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2.5 7.5 5.5 10.5 11.5 3.5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg
            ></span>
            {{ role() === 'seller' ? 'Topper (Seller) account' : 'Student (Buyer) account' }}
          </div>

          @if (role() === 'seller') {
            <div class="seller-note" role="note" style="margin-top:16px">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M10 1.8 2.8 5v4.4c0 4.2 3 7.1 7.2 8.8 4.2-1.7 7.2-4.6 7.2-8.8V5L10 1.8Z"
                  stroke="#D97706"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                />
                <path
                  d="M7.2 10 9 11.8 12.8 8"
                  stroke="#D97706"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div>
                Sellers complete a quick verification (rank proof &amp; ID) right after signup before listing notes.
              </div>
            </div>
          }

          @if (errorMsg(); as msg) {
            <div class="alert" role="alert" style="margin-top:16px">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="8" stroke="#DC2626" stroke-width="1.6" />
                <path d="M10 6.2v4.3" stroke="#DC2626" stroke-width="1.6" stroke-linecap="round" />
                <circle cx="10" cy="13.6" r="1" fill="#DC2626" />
              </svg>
              <div>{{ msg }}</div>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <app-text-field
              label="Full name"
              formControlName="fullName"
              placeholder="e.g. Aarav Sharma"
              autocomplete="name"
              [invalid]="invalid('fullName')"
              error="Please enter your full name."
            />

            <app-text-field
              label="Email"
              type="email"
              formControlName="email"
              placeholder="you@example.com"
              autocomplete="email"
              [invalid]="invalid('email')"
              [error]="emailError()"
            />

            <app-text-field
              label="Password"
              type="password"
              formControlName="password"
              placeholder="Create a password"
              autocomplete="new-password"
              [invalid]="invalid('password')"
              error="Password must be at least 8 characters."
            />

            @if (password()) {
              <div class="strength" [attr.data-level]="strength()">
                <div class="strength-bars"><i></i><i></i><i></i><i></i></div>
                <div class="strength-row">
                  <span class="strength-label">{{ strengthLabel() }}</span>
                  <span>{{ strength() >= 3 ? 'Looks great' : 'Use 8+ chars with a number & symbol' }}</span>
                </div>
              </div>
            }

            <app-text-field
              label="Confirm password"
              type="password"
              formControlName="confirm"
              placeholder="Re-enter your password"
              autocomplete="new-password"
              [invalid]="invalidConfirm()"
              [error]="confirmError()"
            />

            <app-button type="submit" [block]="true" [loading]="loading()">Create account</app-button>
          </form>

          <p class="legal">
            By creating an account you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>.
          </p>
        }
      </div>
    </app-auth-shell>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected step = signal<1 | 2>(1);
  protected role = signal<Role | null>(null);
  protected loading = signal(false);
  protected errorMsg = signal<string | null>(null);

  protected form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  protected password = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  protected strength = computed(() => this.score(this.password()));
  protected strengthLabel = computed(() => STRENGTH[this.strength()]);

  protected invalid(name: 'fullName' | 'email' | 'password'): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }
  protected invalidConfirm(): boolean {
    const c = this.form.get('confirm');
    return !!c && c.touched && (c.invalid || this.form.hasError('mismatch'));
  }
  protected emailError(): string {
    const c = this.form.get('email');
    if (c?.hasError('required')) return 'Email is required.';
    if (c?.hasError('email')) return 'Enter a valid email address.';
    return '';
  }
  protected confirmError(): string {
    const c = this.form.get('confirm');
    if (c?.hasError('required')) return 'Please confirm your password.';
    if (this.form.hasError('mismatch')) return "Passwords don't match.";
    return '';
  }

  private score(v: string): number {
    if (!v) return 0;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    if (v.length >= 12 && s >= 3) s = 4;
    return Math.min(s, 4);
  }

  protected submit(): void {
    this.errorMsg.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { fullName, email, password } = this.form.getRawValue();
    const role = this.role() === 'seller' ? 'SELLER' : 'BUYER';

    this.auth
      .register({ fullName, email, password, role })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate([role === 'SELLER' ? '/seller/verification' : '/browse']);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMsg.set(err?.error?.message ?? 'Could not create your account. Please try again.');
        },
      });
  }
}
