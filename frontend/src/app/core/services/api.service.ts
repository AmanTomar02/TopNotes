import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, PageResponse, Note, Purchase, Review,
  AdminDashboard, SellerDashboard, User, TestConfig, TestQuestionAdmin, PaymentOrder
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private p(obj: Record<string, any>): HttpParams {
    let params = new HttpParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v != null && v !== '') params = params.set(k, String(v));
    });
    return params;
  }

  // ── Notes ──────────────────────────────────────────────────
  getNotes(filters: Record<string, any> = {}): Observable<ApiResponse<PageResponse<Note>>> {
    return this.http.get<ApiResponse<PageResponse<Note>>>(`${this.base}/notes`, { params: this.p(filters) });
  }
  getNote(id: number): Observable<ApiResponse<Note>> {
    return this.http.get<ApiResponse<Note>>(`${this.base}/notes/${id}`);
  }
  getFilters(): Observable<ApiResponse<{ subjects: string[]; classLevels: string[] }>> {
    return this.http.get<any>(`${this.base}/notes/filters`);
  }
  uploadNote(fd: FormData): Observable<ApiResponse<Note>> {
    return this.http.post<ApiResponse<Note>>(`${this.base}/notes`, fd);
  }
  updateNotePrice(id: number, price: number): Observable<ApiResponse<Note>> {
    return this.http.patch<ApiResponse<Note>>(`${this.base}/notes/${id}/price`, { price });
  }
  deleteNote(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/notes/${id}`);
  }
  previewUrl(id: number)  { return `${this.base}/notes/${id}/preview`; }
  viewUrl(id: number)     { return `${this.base}/notes/${id}/view`; }
  getNotePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/notes/${id}/view`, { responseType: 'blob' });
  }

  // ── Buyer ──────────────────────────────────────────────────
  purchaseNote(noteId: number): Observable<ApiResponse<Purchase>> {
    return this.http.post<ApiResponse<Purchase>>(`${this.base}/buyer/purchase/${noteId}`, {});
  }
  createPaymentOrder(noteId: number): Observable<ApiResponse<PaymentOrder>> {
    return this.http.post<ApiResponse<PaymentOrder>>(`${this.base}/buyer/payments/order/${noteId}`, {});
  }
  verifyPayment(body: {
    noteId: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Observable<ApiResponse<Purchase>> {
    return this.http.post<ApiResponse<Purchase>>(`${this.base}/buyer/payments/verify`, body);
  }
  getMyPurchases(page = 0, size = 10): Observable<ApiResponse<PageResponse<Purchase>>> {
    return this.http.get<ApiResponse<PageResponse<Purchase>>>(`${this.base}/buyer/purchases`, { params: this.p({ page, size }) });
  }
  submitReview(noteId: number, rating: number, comment: string): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(`${this.base}/buyer/notes/${noteId}/review`, { rating, comment });
  }
  getNoteReviews(noteId: number, page = 0): Observable<ApiResponse<PageResponse<Review>>> {
    return this.http.get<ApiResponse<PageResponse<Review>>>(`${this.base}/buyer/notes/${noteId}/reviews`, { params: this.p({ page }) });
  }

  // ── Seller ─────────────────────────────────────────────────
  getSellerDashboard(): Observable<ApiResponse<SellerDashboard>> {
    return this.http.get<ApiResponse<SellerDashboard>>(`${this.base}/seller/dashboard`);
  }
  getSellerNotes(page = 0): Observable<ApiResponse<PageResponse<Note>>> {
    return this.http.get<ApiResponse<PageResponse<Note>>>(`${this.base}/seller/notes`, { params: this.p({ page, size: 10 }) });
  }
  getSellerSales(page = 0): Observable<ApiResponse<PageResponse<Purchase>>> {
    return this.http.get<ApiResponse<PageResponse<Purchase>>>(`${this.base}/seller/sales`, { params: this.p({ page, size: 10 }) });
  }
  getVerificationTest(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/seller/verification/test`);
  }
  submitVerificationTest(answers: Record<number, string>): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/seller/verification/test/submit`, answers);
  }
  uploadMarksheet(fd: FormData): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.base}/seller/verification/marksheet`, fd);
  }
  getVerificationStatus(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.base}/seller/verification/status`);
  }

  // ── Admin ──────────────────────────────────────────────────
  getAdminDashboard(): Observable<ApiResponse<AdminDashboard>> {
    return this.http.get<ApiResponse<AdminDashboard>>(`${this.base}/admin/dashboard`);
  }
  getUsers(role?: string, page = 0): Observable<ApiResponse<PageResponse<User>>> {
    const p: any = { page, size: 20 };
    if (role) p.role = role;
    return this.http.get<ApiResponse<PageResponse<User>>>(`${this.base}/admin/users`, { params: this.p(p) });
  }
  suspendUser(id: number): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.base}/admin/users/${id}/suspend`, {});
  }
  activateUser(id: number): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.base}/admin/users/${id}/activate`, {});
  }
  getPendingVerifications(page = 0): Observable<ApiResponse<PageResponse<User>>> {
    return this.http.get<ApiResponse<PageResponse<User>>>(`${this.base}/admin/verifications/pending`, { params: this.p({ page }) });
  }
  approveSeller(id: number, approved: boolean, reason?: string): Observable<ApiResponse<User>> {
    const p: any = { approved };
    if (reason) p.reason = reason;
    return this.http.post<ApiResponse<User>>(`${this.base}/admin/verifications/${id}/approve`, {}, { params: this.p(p) });
  }
  getConfig(): Observable<ApiResponse<Record<string, string>>> {
    return this.http.get<ApiResponse<Record<string, string>>>(`${this.base}/admin/config`);
  }
  updateConfig(configKey: string, configValue: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.base}/admin/config`, { configKey, configValue });
  }

  // ── Admin: Test Management ─────────────────────────────────
  getTestConfig(): Observable<ApiResponse<TestConfig>> {
    return this.http.get<ApiResponse<TestConfig>>(`${this.base}/admin/test/config`);
  }
  updateTestConfig(cfg: TestConfig): Observable<ApiResponse<TestConfig>> {
    return this.http.put<ApiResponse<TestConfig>>(`${this.base}/admin/test/config`, cfg);
  }
  getTestQuestions(keyword?: string, page = 0): Observable<ApiResponse<PageResponse<TestQuestionAdmin>>> {
    const p: any = { page, size: 20 };
    if (keyword) p.keyword = keyword;
    return this.http.get<ApiResponse<PageResponse<TestQuestionAdmin>>>(`${this.base}/admin/test/questions`, { params: this.p(p) });
  }
  createTestQuestion(q: any): Observable<ApiResponse<TestQuestionAdmin>> {
    return this.http.post<ApiResponse<TestQuestionAdmin>>(`${this.base}/admin/test/questions`, q);
  }
  updateTestQuestion(id: number, q: any): Observable<ApiResponse<TestQuestionAdmin>> {
    return this.http.put<ApiResponse<TestQuestionAdmin>>(`${this.base}/admin/test/questions/${id}`, q);
  }
  deleteTestQuestion(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/admin/test/questions/${id}`);
  }
  toggleTestQuestion(id: number, isActive: boolean): Observable<ApiResponse<TestQuestionAdmin>> {
    return this.http.patch<ApiResponse<TestQuestionAdmin>>(`${this.base}/admin/test/questions/${id}/toggle`, null, { params: this.p({ isActive }) });
  }

  // ── Notifications ──────────────────────────────────────────
  getNotifications(page = 0): Observable<ApiResponse<PageResponse<any>>> {
    return this.http.get<ApiResponse<PageResponse<any>>>(`${this.base}/notifications`, { params: this.p({ page }) });
  }
  getUnreadCount(): Observable<ApiResponse<{ count: number }>> {
    return this.http.get<ApiResponse<{ count: number }>>(`${this.base}/notifications/unread-count`);
  }
  markNotificationsRead(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/notifications/mark-all-read`, {});
  }
}
