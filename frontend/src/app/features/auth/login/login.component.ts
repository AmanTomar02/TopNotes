import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
<div class="auth-shell">

  <!-- Left Panel -->
  <div class="auth-left">
    <div class="al-inner">
      <a routerLink="/browse" class="al-logo">
        <div class="al-lm"><svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
        TopNotes
      </a>
      <h1>Knowledge shared,<br><em>futures built.</em></h1>
      <p>Access handwritten notes by India's verified toppers — trusted by 50,000+ students preparing for JEE, NEET, and Board exams.</p>
      <div class="al-stats">
        <div><strong>500+</strong><span>Verified Sellers</span></div>
        <div><strong>12k+</strong><span>Notes Available</span></div>
        <div><strong>4.8★</strong><span>Avg Rating</span></div>
      </div>
    </div>
  </div>

  <!-- Right Panel: Form -->
  <div class="auth-right">
    <div class="auth-card fi">
      <h2>Welcome back</h2>
      <p class="auth-sub">Sign in to continue learning</p>

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }

      <form (ngSubmit)="submit()" #f="ngForm">
        <div class="fg">
          <label class="fl">Email Address</label>
          <input class="fc" type="email" [(ngModel)]="email" name="email"
                 placeholder="you@email.com" required autocomplete="email">
        </div>
        <div class="fg">
          <label class="fl">Password</label>
          <div class="pw-wrap">
            <input class="fc" [type]="showPwd ? 'text' : 'password'"
                   [(ngModel)]="password" name="password"
                   placeholder="Your password" required autocomplete="current-password">
            <button type="button" class="eye" (click)="showPwd = !showPwd">
              {{ showPwd ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>
        <button class="btn btn-primary btn-blk btn-lg" type="submit" [disabled]="loading()">
          @if (loading()) { <span class="sp-btn"></span> }
          {{ loading() ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>

      <div class="auth-or"><span>or</span></div>
      <div class="auth-footer">
        <span>Don't have an account?</span>
        <a routerLink="/register">Create one free →</a>
      </div>
    </div>
  </div>

</div>
  `,
  styleUrls: ['../auth.css']
})
export class LoginComponent {
  email    = '';
  password = '';
  showPwd  = false;
  loading  = signal(false);
  error    = signal('');

  constructor(private auth: AuthService) {}

  submit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) this.auth.navigateAfterLogin();
        else this.error.set(res.message);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Invalid email or password. Please try again.');
      }
    });
  }
}
