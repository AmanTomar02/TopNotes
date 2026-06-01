import { Component, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
<nav class="nav" [class.sc]="scrolled()">
  <div class="ni">
    <a routerLink="/browse" class="logo">
      <div class="lm"><svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
      TopNotes
    </a>

    <div class="tools">
      <div class="ntabs">
        <a routerLink="/browse"      routerLinkActive="act">Browse</a>
        @if (auth.isBuyer())  { <a routerLink="/my-purchases" routerLinkActive="act">My Notes</a> }
        @if (auth.isSeller()) { <a routerLink="/seller/notes" routerLinkActive="act">My Notes</a>
                                <a routerLink="/seller/upload" routerLinkActive="act">Upload</a> }
        @if (auth.isAdmin())  { <a routerLink="/admin/verifications" routerLinkActive="act">Verifications</a>
                                <a routerLink="/admin/test"    routerLinkActive="act">Test Manager</a>
                                <a routerLink="/admin/users"   routerLinkActive="act">Users</a> }
      </div>

      <div class="nbtns">
        @if (!auth.isLoggedIn()) {
          <a routerLink="/login"    class="ghost">Sign In</a>
          <a routerLink="/register" class="dark">Get Started</a>
        } @else {
          <div class="ua">
            <div class="av">{{ auth.user()?.fullName?.charAt(0)?.toUpperCase() }}</div>
            <div class="ud">
              <div class="udn">{{ auth.user()?.fullName }}</div>
              <div class="udr">{{ auth.user()?.role }}</div>
              <hr>
              <a [routerLink]="dashRoute">Dashboard</a>
              <button (click)="auth.logout()">Sign Out</button>
            </div>
          </div>
        }
      </div>
    </div>

    <button class="hbg" (click)="mob.set(!mob())" [class.open]="mob()">
      <span></span><span></span><span></span>
    </button>
  </div>

  @if (mob()) {
    <div class="mm">
      <a routerLink="/browse"         (click)="mob.set(false)">Browse Notes</a>
      @if (auth.isBuyer())  { <a routerLink="/my-purchases"     (click)="mob.set(false)">My Purchases</a> }
      @if (auth.isSeller()) { <a routerLink="/seller/dashboard" (click)="mob.set(false)">Dashboard</a>
                              <a routerLink="/seller/upload"    (click)="mob.set(false)">Upload Notes</a>
                              <a routerLink="/seller/notes"     (click)="mob.set(false)">My Notes</a> }
      @if (auth.isAdmin())  { <a routerLink="/admin/dashboard"      (click)="mob.set(false)">Admin Dashboard</a>
                              <a routerLink="/admin/test"           (click)="mob.set(false)">Test Manager</a>
                              <a routerLink="/admin/verifications"  (click)="mob.set(false)">Verifications</a>
                              <a routerLink="/admin/users"          (click)="mob.set(false)">Users</a> }
      @if (auth.isLoggedIn()) {
        <button class="so" (click)="auth.logout();mob.set(false)">Sign Out</button>
      } @else {
        <a routerLink="/login"    (click)="mob.set(false)">Sign In</a>
        <a routerLink="/register" (click)="mob.set(false)">Register</a>
      }
    </div>
  }
</nav>
  `,
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  scrolled = signal(false);
  mob      = signal(false);
  constructor(public auth: AuthService) {}
  @HostListener('window:scroll') onScroll() { this.scrolled.set(window.scrollY > 20); }
  get dashRoute() {
    if (this.auth.isAdmin())  return '/admin/dashboard';
    if (this.auth.isSeller()) return '/seller/dashboard';
    return '/my-purchases';
  }
}
