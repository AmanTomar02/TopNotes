import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { animate, query, style, transition, trigger } from '@angular/animations';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/services/api.service';
import { AppNotification } from '@core/models';

const routeEnter = trigger('routeEnter', [
  transition('* => *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('200ms cubic-bezier(.16,1,.3,1)', style({ opacity: 1, transform: 'none' })),
      ],
      { optional: true },
    ),
  ]),
]);

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  animations: [routeEnter],
  template: `
    <div class="app">
      <!-- Sidebar -->
      <aside class="sidebar" aria-label="Primary navigation">
        <div class="side-brand">
          <a class="tn-logo" [routerLink]="home()"
            ><span class="mark"><span>T</span></span
            ><span class="logo-text">TopNotes</span></a
          >
        </div>
        <nav class="nav">
          <div class="nav-section buyer">
            <div class="nav-head">Marketplace</div>
            <a class="nav-item" routerLink="/browse" routerLinkActive="active"
              ><span class="ic"
                ><svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.7" />
                  <path
                    d="m20 20-3.2-3.2"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  /></svg></span
              ><span class="lbl">Browse</span></a
            >
            <a class="nav-item" routerLink="/my-purchases" routerLinkActive="active"
              ><span class="ic"
                ><svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7h16l-1.4 11.2A2 2 0 0 1 16.6 20H7.4a2 2 0 0 1-2-1.8L4 7Z"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linejoin="round"
                  />
                  <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.7" /></svg></span
              ><span class="lbl">My Purchases</span></a
            >
          </div>
          <div class="nav-section seller">
            <div class="nav-head">Seller</div>
            <a class="nav-item" routerLink="/seller/dashboard" routerLinkActive="active"
              ><span class="ic"
                ><svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7" />
                  <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.7" />
                  <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7" />
                  <rect
                    x="3"
                    y="16"
                    width="7"
                    height="5"
                    rx="1.5"
                    stroke="currentColor"
                    stroke-width="1.7"
                  /></svg></span
              ><span class="lbl">Dashboard</span></a
            >
            <a class="nav-item" routerLink="/seller/upload" routerLinkActive="active"
              ><span class="ic"
                ><svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  /></svg></span
              ><span class="lbl">Upload</span></a
            >
            <a class="nav-item" routerLink="/seller/notes" routerLinkActive="active"
              ><span class="ic"
                ><svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 3h9l5 5v13H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linejoin="round"
                  />
                  <path d="M14 3v5h5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /></svg></span
              ><span class="lbl">My Notes</span></a
            >
          </div>
          <div class="nav-section admin">
            <div class="nav-head">Admin</div>
            <a class="nav-item" routerLink="/admin/dashboard" routerLinkActive="active"
              ><span class="ic"
                ><svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7" />
                  <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.7" />
                  <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7" />
                  <rect
                    x="3"
                    y="16"
                    width="7"
                    height="5"
                    rx="1.5"
                    stroke="currentColor"
                    stroke-width="1.7"
                  /></svg></span
              ><span class="lbl">Dashboard</span></a
            >
            <a class="nav-item" routerLink="/admin/users" routerLinkActive="active"
              ><span class="ic"
                ><svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="8" r="3.2" stroke="currentColor" stroke-width="1.7" />
                  <path
                    d="M3.5 19a5.5 5.5 0 0 1 11 0"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  />
                  <path
                    d="M16 7.5a3 3 0 0 1 0 6m4.5 5.5a4.7 4.7 0 0 0-3.2-4.4"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  /></svg></span
              ><span class="lbl">Users</span></a
            >
            <a class="nav-item" routerLink="/admin/verifications" routerLinkActive="active"
              ><span class="ic"
                ><svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2.5 4 6v5c0 5 3.5 8 8 9.5 4.5-1.5 8-4.5 8-9.5V6l-8-3.5Z"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linejoin="round"
                  />
                  <path
                    d="m9 12 2 2 4-4.5"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /></svg></span
              ><span class="lbl">Verifications</span></a
            >
            <a class="nav-item" routerLink="/admin/test" routerLinkActive="active"
              ><span class="ic"
                ><svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.7" />
                  <path
                    d="M8 8h5M8 12h8M8 16h6"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  /></svg></span
              ><span class="lbl">Test Manager</span></a
            >
            <a class="nav-item" routerLink="/admin/config" routerLinkActive="active"
              ><span class="ic"
                ><svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7" />
                  <path
                    d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2m10-10 2-2"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  /></svg></span
              ><span class="lbl">Config</span></a
            >
          </div>
        </nav>
      </aside>

      <!-- Topbar -->
      <header class="topbar">
        <button class="collapse-btn hamburger" (click)="drawer.set(true)" aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>
        <button class="collapse-btn" (click)="collapsed.set(!collapsed())" aria-label="Collapse sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>

        <div class="topbar-search">
          <div class="search">
            <span class="s-ic"
              ><svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.7" />
                <path d="m20 20-3.2-3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg></span
            ><input
              class="input"
              type="search"
              placeholder="Search notes, subjects, toppers…"
              [value]="term()"
              (input)="onSearch($any($event.target).value)"
              (keyup.enter)="search()"
              aria-label="Search"
            />
          </div>
        </div>
        <div class="topbar-spacer"></div>

        <div class="topbar-right">
          @if (auth.isLoggedIn()) {
            <button class="icon-btn" (click)="toggleNotif($event)" aria-label="Notifications">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linejoin="round"
                />
                <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
              @if (unread() > 0) {
                <span class="unread"></span>
              }
            </button>
            <button class="avatar-btn" (click)="toggleAvatar($event)" aria-label="Account menu">
              <span class="avatar avatar-sm">{{ initial() }}</span
              ><span class="who"
                ><b>{{ auth.user()?.fullName }}</b
                ><small>{{ roleLabel() }}</small></span
              ><span class="caret"
                ><svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 5.5 7 9.5l4-4"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /></svg
              ></span>
            </button>
          } @else {
            <a class="btn btn-ghost" routerLink="/login">Log in</a>
            <a class="btn btn-primary" routerLink="/register">Sign up</a>
          }
        </div>
      </header>

      <!-- Main -->
      <main class="main">
        <div class="main-pad" [@routeEnter]="routeKey(o)"><router-outlet #o="outlet" /></div>
      </main>
    </div>

    <!-- Popovers -->
    <div class="pop pop-menu" [class.open]="avatarOpen()" role="menu">
      <div class="menu-head">
        <span class="avatar">{{ initial() }}</span
        ><span class="who"
          ><b>{{ auth.user()?.fullName }}</b
          ><small>{{ auth.user()?.email }}</small></span
        >
      </div>
      <div class="menu-list">
        <a class="menu-item" [routerLink]="home()"
          ><span class="ic"
            ><svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.4" stroke="currentColor" stroke-width="1.7" />
              <path
                d="M5 20a7 7 0 0 1 14 0"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              /></svg></span
          >Dashboard<span class="badge badge-indigo menu-role">{{ roleLabel() }}</span></a
        >
        <div class="menu-sep"></div>
        <button class="menu-item danger" (click)="auth.logout()">
          <span class="ic"
            ><svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M11 5h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              /></svg></span
          >Log out
        </button>
      </div>
    </div>

    <div class="pop" [class.open]="notifOpen()" role="region" aria-label="Notifications">
      <div class="notif-head">
        <h3>Notifications</h3>
        <button
          type="button"
          (click)="markAllRead()"
          style="font-size:var(--t-12);font-weight:600;color:var(--indigo-600);background:none;border:none;cursor:pointer;"
        >
          Mark all read
        </button>
      </div>
      <div class="notif-list">
        @if (notifLoading()) {
          <div class="notif">
            <div class="n-body"><p class="muted">Loading…</p></div>
          </div>
        } @else if (notifications().length === 0) {
          <div class="notif">
            <div class="n-body"><p class="muted">You're all caught up 🎉</p></div>
          </div>
        } @else {
          @for (n of notifications(); track n.id) {
            <div class="notif" [class.unread]="!n.isRead">
              <span class="n-ic" [class]="'n-ic ' + iconColor(n.type)"
                ><svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m5 13 4 4L19 7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /></svg
              ></span>
              <div class="n-body">
                <p>{{ n.message }}</p>
                <time>{{ n.title }}</time>
              </div>
            </div>
          }
        }
      </div>
    </div>

    <!-- Mobile drawer scrim -->
    <div
      class="scrim"
      [class.open]="drawer()"
      role="button"
      tabindex="0"
      aria-label="Close menu"
      (click)="drawer.set(false)"
      (keydown.enter)="drawer.set(false)"
    ></div>

    <!-- Mobile bottom tabs -->
    <nav class="mobile-tabs" aria-label="Mobile navigation">
      <div class="mtab-section buyer">
        <a class="mtab" routerLink="/browse" routerLinkActive="active"
          ><svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.7" />
            <path d="m20 20-3.2-3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg
          ><span>Browse</span></a
        >
        <a class="mtab" routerLink="/my-purchases" routerLinkActive="active"
          ><svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7h16l-1.4 11.2A2 2 0 0 1 16.6 20H7.4a2 2 0 0 1-2-1.8L4 7Z"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linejoin="round"
            /></svg
          ><span>Purchases</span></a
        >
      </div>
      <div class="mtab-section seller">
        <a class="mtab" routerLink="/seller/dashboard" routerLinkActive="active"
          ><svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.7" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.7" /></svg
          ><span>Dash</span></a
        >
        <a class="mtab" routerLink="/seller/upload" routerLinkActive="active"
          ><svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            /></svg
          ><span>Upload</span></a
        >
        <a class="mtab" routerLink="/seller/notes" routerLinkActive="active"
          ><svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 3h9l5 5v13H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linejoin="round"
            /></svg
          ><span>Notes</span></a
        >
      </div>
      <div class="mtab-section admin">
        <a class="mtab" routerLink="/admin/dashboard" routerLinkActive="active"
          ><svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.7" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.7" /></svg
          ><span>Home</span></a
        >
        <a class="mtab" routerLink="/admin/users" routerLinkActive="active"
          ><svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="8" r="3.2" stroke="currentColor" stroke-width="1.7" />
            <path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg
          ><span>Users</span></a
        >
        <a class="mtab" routerLink="/admin/verifications" routerLinkActive="active"
          ><svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2.5 4 6v5c0 5 3.5 8 8 9.5 4.5-1.5 8-4.5 8-9.5V6l-8-3.5Z"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linejoin="round"
            /></svg
          ><span>Verify</span></a
        >
        <a class="mtab" routerLink="/admin/config" routerLinkActive="active"
          ><svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7" />
            <path
              d="M12 2v3m0 14v3M2 12h3m14 0h3"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
            /></svg
          ><span>Config</span></a
        >
      </div>
    </nav>
  `,
})
export class AppShellComponent {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected collapsed = signal(false);
  protected drawer = signal(false);
  protected notifOpen = signal(false);
  protected avatarOpen = signal(false);
  protected term = signal('');
  protected unread = signal(0);
  protected notifications = signal<AppNotification[]>([]);
  protected notifLoading = signal(false);

  protected roleAttr = computed(() => (this.auth.isAdmin() ? 'admin' : this.auth.isSeller() ? 'seller' : 'buyer'));
  protected roleLabel = computed(() => {
    const r = this.auth.user()?.role;
    return r === 'ADMIN' ? 'Administrator' : r === 'SELLER' ? 'Topper · Seller' : 'Buyer';
  });
  protected home = computed(() =>
    this.auth.isAdmin() ? '/admin/dashboard' : this.auth.isSeller() ? '/seller/dashboard' : '/browse',
  );
  protected initial = computed(() => (this.auth.user()?.fullName ?? '?').charAt(0).toUpperCase());

  private search$ = new Subject<string>();

  constructor() {
    // Debounced live search → navigate to Browse with ?keyword.
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => this.navigateSearch(q));

    // Reflect shell state onto <body> for the design's CSS selectors.
    effect(() => {
      const b = document.body;
      b.classList.add('app-body');
      b.dataset['role'] = this.roleAttr();
      b.dataset['collapsed'] = this.collapsed() ? '1' : '0';
      b.dataset['drawer'] = this.drawer() ? '1' : '0';
    });
    this.destroyRef.onDestroy(() => {
      const b = document.body;
      b.classList.remove('app-body');
      b.removeAttribute('data-role');
      b.removeAttribute('data-collapsed');
      b.removeAttribute('data-drawer');
    });

    if (this.auth.isLoggedIn()) {
      this.api
        .getUnreadCount()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: (r) => this.unread.set(r.data?.count ?? 0), error: () => {} });
    }
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.drawer.set(false);
        this.closeMenus();
      });
  }

  @HostListener('document:click')
  protected closeMenus() {
    this.notifOpen.set(false);
    this.avatarOpen.set(false);
  }

  protected toggleAvatar(e: Event) {
    e.stopPropagation();
    this.notifOpen.set(false);
    this.avatarOpen.update((v) => !v);
  }

  protected toggleNotif(e: Event) {
    e.stopPropagation();
    this.avatarOpen.set(false);
    const opening = !this.notifOpen();
    this.notifOpen.set(opening);
    if (opening) this.loadNotifications();
  }

  protected markAllRead() {
    this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
    if (this.unread() > 0) {
      this.api
        .markNotificationsRead()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: () => this.unread.set(0), error: () => {} });
    }
  }

  private loadNotifications() {
    this.notifLoading.set(true);
    this.api
      .getNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.notifications.set((r.data?.content ?? []) as AppNotification[]);
          this.notifLoading.set(false);
          this.markAllRead();
        },
        error: () => this.notifLoading.set(false),
      });
  }

  protected iconColor(type: AppNotification['type']): string {
    return type === 'SALE' || type === 'PAYMENT' ? 'green' : type === 'REVIEW' ? 'amber' : 'indigo';
  }

  protected onSearch(value: string) {
    this.term.set(value);
    this.search$.next(value);
  }

  protected search() {
    this.navigateSearch(this.term());
  }

  private navigateSearch(value: string) {
    const q = value.trim();
    this.router.navigate(['/browse'], { queryParams: { keyword: q || null, page: null } });
  }

  protected routeKey(o: RouterOutlet) {
    return o?.isActivated ? o.activatedRoute.snapshot.url.map((s) => s.path).join('/') || 'home' : '';
  }
}
