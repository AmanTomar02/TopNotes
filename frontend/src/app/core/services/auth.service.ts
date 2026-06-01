import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'tn_token';
  private readonly USER_KEY  = 'tn_user';

  private _user = signal<AuthResponse | null>(this.loadStored());

  readonly user        = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => !!this._user());
  readonly isAdmin     = computed(() => this._user()?.role === 'ADMIN');
  readonly isSeller    = computed(() => this._user()?.role === 'SELLER');
  readonly isBuyer     = computed(() => this._user()?.role === 'BUYER');

  constructor(private http: HttpClient, private router: Router) {}

  register(body: {
    fullName: string; email: string; password: string;
    phone?: string; role: string;
  }): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/register`, body)
      .pipe(tap(r => { if (r.success) this.persist(r.data); }));
  }

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(r => { if (r.success) this.persist(r.data); }));
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }

  navigateAfterLogin() {
    const role = this._user()?.role;
    if (role === 'ADMIN')  this.router.navigate(['/admin/dashboard']);
    else if (role === 'SELLER') this.router.navigate(['/seller/dashboard']);
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
    } catch { return null; }
  }
}
