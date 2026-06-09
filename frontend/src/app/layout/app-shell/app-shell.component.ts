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
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  animations: [routeEnter],
  template: `
    <div class="app">
      <!-- Sidebar -->
      <aside class="sidebar" aria-label="Primary navigation">
        <div class="side-brand">
          <a class="tn-logo" routerLink="/browse"
            ><span class="mark"><span>T</span></span
            ><span class="logo-text">TopNotes</span></a
          >
        </div>
        <nav class="nav">
          <div class="nav-section buyer">
            <div class="nav-head">Marketplace</div>
            <a class="nav-item" routerLink="/browse" routerLinkActive="active"
              ><span class="ic"><lucide-icon name="search" [size]="20" [strokeWidth]="1.7" /></span
              ><span class="lbl">Browse</span></a
            >
            <a class="nav-item" routerLink="/my-purchases" routerLinkActive="active"
              ><span class="ic"><lucide-icon name="shopping-bag" [size]="20" [strokeWidth]="1.7" /></span
              ><span class="lbl">My Purchases</span></a
            >
            @if (auth.isBuyer()) {
              <button type="button" class="nav-item nav-cta" (click)="becomeSeller()" [disabled]="upgrading()">
                <span class="ic"><lucide-icon name="store" [size]="20" [strokeWidth]="1.7" /></span
                ><span class="lbl">{{ upgrading() ? 'Upgrading…' : 'Become a seller' }}</span>
              </button>
            }
          </div>
          <div class="nav-section seller">
            <div class="nav-head">Seller</div>
            <a class="nav-item" routerLink="/seller/dashboard" routerLinkActive="active"
              ><span class="ic"><lucide-icon name="layout-dashboard" [size]="20" [strokeWidth]="1.7" /></span
              ><span class="lbl">Dashboard</span></a
            >
            <a class="nav-item" routerLink="/seller/upload" routerLinkActive="active"
              ><span class="ic"><lucide-icon name="upload" [size]="20" [strokeWidth]="1.7" /></span
              ><span class="lbl">Upload</span></a
            >
            <a class="nav-item" routerLink="/seller/notes" routerLinkActive="active"
              ><span class="ic"><lucide-icon name="file-text" [size]="20" [strokeWidth]="1.7" /></span
              ><span class="lbl">My Notes</span></a
            >
          </div>
          <div class="nav-section admin">
            <div class="nav-head">Admin</div>
            <a class="nav-item" routerLink="/admin/dashboard" routerLinkActive="active"
              ><span class="ic"><lucide-icon name="layout-dashboard" [size]="20" [strokeWidth]="1.7" /></span
              ><span class="lbl">Dashboard</span></a
            >
            <a class="nav-item" routerLink="/admin/users" routerLinkActive="active"
              ><span class="ic"><lucide-icon name="users" [size]="20" [strokeWidth]="1.7" /></span
              ><span class="lbl">Users</span></a
            >
            <a class="nav-item" routerLink="/admin/verifications" routerLinkActive="active"
              ><span class="ic"><lucide-icon name="shield-check" [size]="20" [strokeWidth]="1.7" /></span
              ><span class="lbl">Verifications</span></a
            >
            <a class="nav-item" routerLink="/admin/test" routerLinkActive="active"
              ><span class="ic"><lucide-icon name="clipboard-list" [size]="20" [strokeWidth]="1.7" /></span
              ><span class="lbl">Test Manager</span></a
            >
            <a class="nav-item" routerLink="/admin/config" routerLinkActive="active"
              ><span class="ic"><lucide-icon name="settings" [size]="20" [strokeWidth]="1.7" /></span
              ><span class="lbl">Config</span></a
            >
          </div>
        </nav>
      </aside>

      <!-- Topbar -->
      <header class="topbar">
        <button class="collapse-btn hamburger" (click)="drawer.set(true)" aria-label="Open menu">
          <lucide-icon name="menu" [size]="22" [strokeWidth]="1.8" />
        </button>
        <button class="collapse-btn" (click)="collapsed.set(!collapsed())" aria-label="Collapse sidebar">
          <lucide-icon name="panel-left" [size]="20" [strokeWidth]="1.8" />
        </button>

        <div class="topbar-search">
          <div class="search">
            <span class="s-ic"><lucide-icon name="search" [size]="18" [strokeWidth]="1.7" /></span
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
              <lucide-icon name="bell" [size]="22" [strokeWidth]="1.7" />
              @if (unread() > 0) {
                <span class="unread"></span>
              }
            </button>
            <button class="avatar-btn" (click)="toggleAvatar($event)" aria-label="Account menu">
              <span class="avatar avatar-sm">{{ initial() }}</span
              ><span class="who"
                ><b>{{ auth.user()?.fullName }}</b
                ><small>{{ roleLabel() }}</small></span
              ><span class="caret"><lucide-icon name="chevron-down" [size]="16" [strokeWidth]="1.7" /></span>
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
          ><span class="ic"><lucide-icon name="user" [size]="18" [strokeWidth]="1.7" /></span>Dashboard<span
            class="badge badge-indigo menu-role"
            >{{ roleLabel() }}</span
          ></a
        >
        <div class="menu-sep"></div>
        <button class="menu-item danger" (click)="auth.logout()">
          <span class="ic"><lucide-icon name="log-out" [size]="18" [strokeWidth]="1.7" /></span>Log out
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
                ><lucide-icon name="check" [size]="18" [strokeWidth]="2" /></span>
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
          ><lucide-icon name="search" [size]="22" [strokeWidth]="1.7" /><span>Browse</span></a
        >
        <a class="mtab" routerLink="/my-purchases" routerLinkActive="active"
          ><lucide-icon name="shopping-bag" [size]="22" [strokeWidth]="1.7" /><span>Purchases</span></a
        >
      </div>
      <div class="mtab-section seller">
        <a class="mtab" routerLink="/seller/dashboard" routerLinkActive="active"
          ><lucide-icon name="layout-dashboard" [size]="22" [strokeWidth]="1.7" /><span>Dash</span></a
        >
        <a class="mtab" routerLink="/seller/upload" routerLinkActive="active"
          ><lucide-icon name="upload" [size]="22" [strokeWidth]="1.7" /><span>Upload</span></a
        >
        <a class="mtab" routerLink="/seller/notes" routerLinkActive="active"
          ><lucide-icon name="file-text" [size]="22" [strokeWidth]="1.7" /><span>Notes</span></a
        >
      </div>
      <div class="mtab-section admin">
        <a class="mtab" routerLink="/admin/dashboard" routerLinkActive="active"
          ><lucide-icon name="layout-dashboard" [size]="22" [strokeWidth]="1.7" /><span>Home</span></a
        >
        <a class="mtab" routerLink="/admin/users" routerLinkActive="active"
          ><lucide-icon name="users" [size]="22" [strokeWidth]="1.7" /><span>Users</span></a
        >
        <a class="mtab" routerLink="/admin/verifications" routerLinkActive="active"
          ><lucide-icon name="shield-check" [size]="22" [strokeWidth]="1.7" /><span>Verify</span></a
        >
        <a class="mtab" routerLink="/admin/config" routerLinkActive="active"
          ><lucide-icon name="settings" [size]="22" [strokeWidth]="1.7" /><span>Config</span></a
        >
      </div>
    </nav>
  `,
})
export class AppShellComponent {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private toast = inject(ToastService);
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
  protected upgrading = signal(false);

  protected roleLabel = computed(() => {
    if (this.auth.isAdmin()) return 'Administrator';
    // Every non-admin can buy; sellers can do both.
    return this.auth.canSell() ? 'Buyer & Seller' : 'Buyer';
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
    // Capabilities are independent classes — a user can be both buyer & seller.
    effect(() => {
      const b = document.body;
      b.classList.add('app-body');
      const admin = this.auth.isAdmin();
      b.classList.toggle('is-admin', admin);
      b.classList.toggle('is-seller', this.auth.isSeller() && !admin);
      b.classList.toggle('is-buyer', this.auth.isLoggedIn() && !admin);
      b.dataset['collapsed'] = this.collapsed() ? '1' : '0';
      b.dataset['drawer'] = this.drawer() ? '1' : '0';
    });
    this.destroyRef.onDestroy(() => {
      const b = document.body;
      b.classList.remove('app-body', 'is-admin', 'is-seller', 'is-buyer');
      b.removeAttribute('data-collapsed');
      b.removeAttribute('data-drawer');
    });

    if (this.auth.isLoggedIn()) {
      // Refresh the JWT each time the shell loads so an admin-approved seller
      // picks up isVerified=true on reload without logging out and back in.
      this.auth.refreshSession();
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

  /** Upgrade a buyer into a seller, then send them into verification. */
  protected becomeSeller() {
    if (this.upgrading()) return;
    this.upgrading.set(true);
    this.auth
      .becomeSeller()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.upgrading.set(false);
          this.toast.success('You are now a seller — complete verification to publish notes.');
          this.router.navigate(['/seller/verification']);
        },
        error: () => {
          this.upgrading.set(false);
          this.toast.error('Could not upgrade to seller. Please try again.');
        },
      });
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
