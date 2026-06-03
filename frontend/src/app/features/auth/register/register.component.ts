import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
<div class="auth-shell">

  <!-- Left Panel -->
  <div class="auth-left teal">
    <div class="al-inner">
      <a routerLink="/browse" class="al-logo">
        <div class="al-lm"><svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
        TopNotes
      </a>
      <h1>Join India's <em>knowledge economy.</em></h1>
      <p>Students buy notes. Toppers earn money. Everyone wins.</p>

      <div class="role-cards">
        <div class="rc" [class.active]="role === 'BUYER'" (click)="role = 'BUYER'">
          <div class="ri">📚</div>
          <strong>I'm a Student</strong>
          <span>Buy & read verified notes</span>
        </div>
        <div class="rc" [class.active]="role === 'SELLER'" (click)="role = 'SELLER'">
          <div class="ri">✍️</div>
          <strong>I'm a Topper</strong>
          <span>Sell my handwritten notes</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Right Panel: Form -->
  <div class="auth-right">
    <div class="auth-card fi">
      <h2>Create Account</h2>
      <p class="auth-sub">Free forever · No credit card needed</p>

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }
      @if (success()) {
        <div class="alert alert-success">{{ success() }}</div>
      }

      <form (ngSubmit)="submit()" #f="ngForm">
        <div class="fg">
          <label class="fl">Full Name</label>
          <input class="fc" type="text" [(ngModel)]="fullName" name="fullName"
                 placeholder="Your full name" required minlength="2">
        </div>
        <div class="fg">
          <label class="fl">Email Address</label>
          <input class="fc" type="email" [(ngModel)]="email" name="email"
                 placeholder="you@email.com" required autocomplete="email">
        </div>
        <div class="fg">
          <label class="fl">Password <span style="font-weight:400;color:var(--mu)">(min 8 chars)</span></label>
          <div class="pw-wrap">
            <input class="fc" [type]="showPwd ? 'text' : 'password'"
                   [(ngModel)]="password" name="password"
                   placeholder="Create a strong password" required minlength="8">
            <button type="button" class="eye" (click)="showPwd = !showPwd">
              {{ showPwd ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>
        <div class="fg">
          <label class="fl">Phone <span style="font-weight:400;color:var(--mu)">(optional)</span></label>
          <input class="fc" type="tel" [(ngModel)]="phone" name="phone"
                 placeholder="+91 98765 43210">
        </div>
        <div class="fg">
          <label class="fl">I want to…</label>
          <div class="role-toggle">
            <button type="button" class="role-btn" [class.active]="role === 'BUYER'"  (click)="role = 'BUYER'">
              📚 Buy Notes
            </button>
            <button type="button" class="role-btn" [class.active]="role === 'SELLER'" (click)="role = 'SELLER'">
              ✍️ Sell Notes
            </button>
          </div>
        </div>

        <button class="btn btn-primary btn-blk btn-lg" type="submit" [disabled]="loading()">
          @if (loading()) { <span class="sp-btn"></span> }
          {{ loading() ? 'Creating account…' : 'Create Account' }}
        </button>
      </form>

      <div class="auth-or"><span>or</span></div>
      <div class="auth-footer">
        <span>Already have an account?</span>
        <a routerLink="/login">Sign in →</a>
      </div>

      <p style="font-size:.72rem;color:var(--mu);text-align:center;margin-top:1rem;line-height:1.5">
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  </div>

</div>
  `,
  styleUrls: ['../auth.css']
})
export class RegisterComponent {
  fullName = '';
  email    = '';
  password = '';
  phone    = '';
  role     = 'BUYER';
  showPwd  = false;
  loading  = signal(false);
  error    = signal('');
  success  = signal('');

  constructor(private auth: AuthService) {}

  submit() {
    if (!this.fullName || !this.email || !this.password) {
      this.error.set('Please fill in all required fields.');
      return;
    }
    if (this.password.length < 8) {
      this.error.set('Password must be at least 8 characters.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.auth.register({
      fullName: this.fullName,
      email:    this.email,
      password: this.password,
      phone:    this.phone || undefined,
      role:     this.role
    }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.success.set('Account created! Redirecting…');
          setTimeout(() => this.auth.navigateAfterLogin(), 800);
        } else {
          this.error.set(res.message);
        }
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Registration failed. Please try again.');
      }
    });
  }
}
