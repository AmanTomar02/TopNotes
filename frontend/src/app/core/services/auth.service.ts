import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthResponse, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'tn_token';
  private readonly USER_KEY = 'tn_user';

  private _user = signal<AuthResponse | null>(this.loadStored());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');
  readonly isSeller = computed(() => this._user()?.role === 'SELLER');
  readonly isBuyer = computed(() => this._user()?.role === 'BUYER');
  readonly isVerified = computed(() => !!this._user()?.isVerified);

  // ── Capabilities (a user can both buy and sell) ───────────────
  /** Any logged-in non-admin can browse and buy notes. */
  readonly canBuy = computed(() => this.isLoggedIn() && !this.isAdmin());
  /** Sellers can sell (publishing still requires verification). */
  readonly canSell = computed(() => this.isSeller());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  register(body: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
  }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/register`, body).pipe(
      tap((r) => {
        if (r.success) this.persist(r.data);
      }),
    );
  }

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap((r) => {
        if (r.success) this.persist(r.data);
      }),
    );
  }

  /**
   * Upgrade the current buyer into a seller. The backend re-issues a JWT with
   * the SELLER role, which we persist so seller features unlock immediately.
   * Buying ability is retained.
   */
  becomeSeller(): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/profile/become-seller`, {}).pipe(
      tap((r) => {
        if (r.success) this.persist(r.data);
      }),
    );
  }

  /**
   * Silently re-issue the JWT from the server so locally-cached fields
   * (esp. isVerified after an admin approval) stay fresh — no re-login needed.
   * Fails quietly; the error interceptor still handles a genuinely expired token.
   */
  refreshSession(): void {
    if (!this.isLoggedIn()) return;
    this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/profile/refresh-token`, {}).subscribe({
      next: (r) => {
        if (r.success) this.persist(r.data);
      },
      error: () => {},
    });
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Returning users land on the shared marketplace home (Browse). Only admins
   * go to their console. A seller's dashboard stays one click away in the nav;
   * first-time seller onboarding (verification) is handled by the signup flow.
   */
  navigateAfterLogin() {
    if (this._user()?.role === 'ADMIN') this.router.navigate(['/admin/dashboard']);
    else this.router.navigate(['/browse']);
  }

  private persist(data: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, data.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data));
    this._user.set(data);
  }

  private loadStored(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
