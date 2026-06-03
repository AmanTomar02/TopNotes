import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { Note, PaymentOrder, Review } from '@core/models';

declare const Razorpay: any;

@Component({
  selector: 'app-note-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent],
  template: `
<app-navbar></app-navbar>
<div class="page-shell">
  <div class="container" style="padding-top:1.5rem;padding-bottom:4rem">
    @if (loading()) { <div class="sw"><div class="sp"></div></div> }
    @else if (note()) {
      <div class="detail-grid">

        <!-- Left -->
        <div>
          <!-- Preview -->
          <div style="background:var(--ink2);border-radius:20px;overflow:hidden;box-shadow:var(--shl);margin-bottom:2rem;position:relative">
            <div style="position:absolute;top:.75rem;left:.75rem;background:var(--ink);color:var(--gd);font-size:.65rem;font-weight:700;padding:.2rem .7rem;border-radius:100px;letter-spacing:.05em;z-index:2">📄 FIRST PAGE PREVIEW</div>
            <div style="padding:3rem 2.5rem 0;display:flex;flex-direction:column;gap:.55rem;min-height:260px">
              @for (i of [1,2,3,4,5,6,7,8,9,10]; track i) {
                <div [style.height]="i===1||i===6?'14px':'9px'" [style.width]="['90%','75%','85%','60%','95%','55%','80%','70%','88%','65%'][i-1]"
                     style="background:rgba(255,255,255,.08);border-radius:4px"></div>
              }
            </div>
            <div style="background:linear-gradient(to top,rgba(12,11,20,.95),transparent);padding:2rem 1.5rem 1.5rem;text-align:center;color:#fff">
              <div style="font-size:1.6rem;margin-bottom:.35rem">🔒</div>
              <p style="font-size:.82rem;color:rgba(255,255,255,.55)">Purchase to unlock all {{ note()!.totalPages || '?' }} pages</p>
            </div>
          </div>

          <!-- Reviews -->
          <h3 style="font-size:1.2rem;margin-bottom:1rem">Student Reviews</h3>
          @if (auth.isBuyer() && note()!.isPurchased) {
            <div style="background:var(--cr2);border-radius:14px;padding:1.1rem;margin-bottom:1.25rem">
              <div style="font-size:.8rem;font-weight:600;margin-bottom:.5rem">Write a Review</div>
              <div style="display:flex;gap:.2rem;margin-bottom:.5rem">
                @for (s of [1,2,3,4,5]; track s) {
                  <button (click)="myRating=s" style="font-size:1.4rem;background:none;border:none;cursor:pointer;transition:transform .15s" [style.color]="s<=myRating?'#f59e0b':'#e4dfd5'" [style.transform]="s<=myRating?'scale(1.1)':'scale(1)'">★</button>
                }
              </div>
              <textarea class="fc" [(ngModel)]="myComment" rows="2" placeholder="Share your thoughts…"></textarea>
              <button class="btn btn-teal btn-sm" style="margin-top:.5rem" (click)="submitReview()" [disabled]="reviewLoading()">
                {{ reviewLoading() ? 'Submitting…' : 'Submit Review' }}
              </button>
              @if (reviewMsg()) { <div class="alert alert-success" style="margin-top:.5rem;margin-bottom:0">{{ reviewMsg() }}</div> }
            </div>
          }
          @if (reviews().length === 0) { <p style="color:var(--mu);font-size:.88rem">No reviews yet.</p> }
          @for (r of reviews(); track r.id) {
            <div style="background:#fff;border-radius:14px;padding:.95rem;box-shadow:var(--sh);margin-bottom:.65rem">
              <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.4rem">
                <div style="width:30px;height:30px;border-radius:50%;background:var(--ink2);color:var(--gd);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700">{{ r.buyerName?.charAt(0) }}</div>
                <div><div style="font-weight:700;font-size:.85rem">{{ r.buyerName }}</div><div style="color:#f59e0b;font-size:.8rem">{{ '★'.repeat(r.rating) + '☆'.repeat(5-r.rating) }}</div></div>
                <div style="font-size:.72rem;color:var(--mu);margin-left:auto">{{ r.createdAt | date:'mediumDate' }}</div>
              </div>
              @if (r.comment) { <p style="font-size:.83rem;color:var(--ink3);line-height:1.6">{{ r.comment }}</p> }
            </div>
          }
        </div>

        <!-- Right: sidebar -->
        <div style="background:#fff;border-radius:22px;padding:1.5rem;box-shadow:var(--shl);position:sticky;top:82px">
          <div style="display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.75rem">
            @if (note()!.classLevel) { <span class="badge badge-tl">{{ note()!.classLevel }}</span> }
            @if (note()!.subject)    { <span class="badge badge-gd">{{ note()!.subject }}</span> }
            @if (note()!.examType)   { <span class="badge badge-ik">{{ note()!.examType }}</span> }
          </div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:700;line-height:1.25;margin-bottom:.6rem">{{ note()!.title }}</div>
          @if (note()!.reviewCount) {
            <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.85rem">
              <span style="color:#f59e0b;font-size:.95rem">{{ '★'.repeat(Math.floor(note()!.averageRating||0)) }}{{ '☆'.repeat(5-Math.floor(note()!.averageRating||0)) }}</span>
              <strong style="font-size:.9rem">{{ note()!.averageRating?.toFixed(1) }}</strong>
              <span style="font-size:.78rem;color:var(--mu)">({{ note()!.reviewCount }} reviews)</span>
            </div>
          }
          @if (note()!.seller) {
            <div style="display:flex;align-items:center;gap:.7rem;background:var(--cr);border-radius:12px;padding:.8rem;margin-bottom:.9rem">
              <div style="width:38px;height:38px;border-radius:50%;background:var(--ink);color:var(--gd);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:700;flex-shrink:0">{{ note()!.seller!.fullName.charAt(0) }}</div>
              <div><div style="font-weight:700;font-size:.88rem">{{ note()!.seller!.fullName }}</div><div style="font-size:.75rem;color:var(--mu)">{{ note()!.seller!.institution || note()!.seller!.classLevel }}</div></div>
            </div>
          }
          <p style="font-size:.83rem;color:var(--ink3);line-height:1.65;margin-bottom:.9rem">{{ note()!.description }}</p>
          <div style="display:flex;flex-direction:column;gap:.35rem;margin-bottom:1.1rem">
            @if (note()!.totalPages) { <div style="display:flex;align-items:center;gap:.4rem;font-size:.8rem;color:var(--mu)"><span>📄</span> {{ note()!.totalPages }} pages</div> }
            <div style="display:flex;align-items:center;gap:.4rem;font-size:.8rem;color:var(--mu)"><span>🛒</span> {{ note()!.purchaseCount || 0 }} purchases</div>
          </div>
          <div style="border-top:1px solid var(--cr3);padding-top:1rem">
            <div style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:700;margin-bottom:.85rem">₹{{ note()!.price }}</div>
            @if (note()!.isPurchased) {
              <a [routerLink]="['/notes', note()!.id, 'view']" class="btn btn-teal btn-blk" style="margin-bottom:.5rem">📖 Read Notes</a>
              <div class="alert alert-success" style="margin-top:.6rem;margin-bottom:0">Already purchased on this buyer account.</div>
            } @else if (auth.isBuyer()) {
              <button class="btn btn-gold btn-blk btn-lg" (click)="buy()" [disabled]="buyLoading()">
                @if (buyLoading()) { <span class="sp-btn"></span> }
                {{ buyLoading() ? 'Processing payment…' : '💳 Pay with Razorpay ₹' + note()!.price }}
              </button>
              @if (buyError()) { <div class="alert alert-error" style="margin-top:.6rem;margin-bottom:0">{{ buyError() }}</div> }
            } @else if (auth.isLoggedIn()) {
              <div class="alert alert-info" style="margin-bottom:0">Payment is available only from a buyer account. Sign out and login as buyer to purchase.</div>
            } @else if (!auth.isLoggedIn()) {
              <a routerLink="/register" class="btn btn-primary btn-blk btn-lg">Sign up to Purchase</a>
            }
          </div>
          <div style="text-align:center;font-size:.72rem;color:var(--mu);margin-top:.8rem">🔒 Secure · No download · Watermarked per user</div>
        </div>
      </div>
    }
  </div>
</div>
  `,
  styles: [`.detail-grid{display:grid;grid-template-columns:1fr 360px;gap:2rem;align-items:start}
    .sp-btn{width:16px;height:16px;border:2px solid rgba(12,11,20,.2);border-top-color:var(--ink);border-radius:50%;animation:spin .7s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:880px){.detail-grid{grid-template-columns:1fr}}`]
})
export class NoteDetailComponent implements OnInit {
  note         = signal<Note | null>(null);
  reviews      = signal<Review[]>([]);
  loading      = signal(true);
  buyLoading   = signal(false);
  buyError     = signal('');
  reviewLoading= signal(false);
  reviewMsg    = signal('');
  myRating     = 0;
  myComment    = '';
  Math         = Math;

  constructor(private route: ActivatedRoute, public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getNote(id).subscribe(r => {
      this.loading.set(false);
      if (r.success) { this.note.set(r.data); this.loadReviews(id); }
    });
  }

  loadReviews(id: number) {
    this.api.getNoteReviews(id).subscribe(r => { if (r.success) this.reviews.set(r.data.content); });
  }

  buy() {
    this.buyLoading.set(true);
    this.buyError.set('');
    this.api.createPaymentOrder(this.note()!.id).subscribe({
      next: r => {
        if (!r.success) {
          this.buyLoading.set(false);
          this.buyError.set(r.message);
          return;
        }
        r.data.provider === 'DEMO' ? this.completeDemoPayment(r.data) : this.openRazorpay(r.data);
      },
      error: err => {
        this.buyLoading.set(false);
        this.buyError.set(err?.error?.message || 'Could not start payment. Please try again.');
      }
    });
  }

  private completeDemoPayment(order: PaymentOrder) {
    this.verify({
      noteId: order.noteId,
      razorpayOrderId: order.orderId,
      razorpayPaymentId: `demo_pay_${Date.now()}`,
      razorpaySignature: 'demo'
    });
  }

  private openRazorpay(order: PaymentOrder) {
    this.loadRazorpayScript().then(() => {
      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: 'TopNotes',
        description: order.noteTitle,
        order_id: order.orderId,
        prefill: {
          name: order.buyerName || this.auth.user()?.fullName,
          email: order.buyerEmail || this.auth.user()?.email
        },
        theme: { color: '#1e6b6b' },
        modal: {
          ondismiss: () => this.buyLoading.set(false)
        },
        handler: (response: any) => this.verify({
          noteId: order.noteId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        })
      });
      checkout.open();
    }).catch(() => {
      this.buyLoading.set(false);
      this.buyError.set('Payment checkout could not load. Check your internet connection.');
    });
  }

  private verify(body: {
    noteId: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    this.api.verifyPayment(body).subscribe({
      next: r => {
        this.buyLoading.set(false);
        if (r.success) {
          const n = this.note()!;
          this.note.set({...n, isPurchased: true, purchaseCount: (n.purchaseCount || 0) + 1});
        } else {
          this.buyError.set(r.message);
        }
      },
      error: err => {
        this.buyLoading.set(false);
        this.buyError.set(err?.error?.message || 'Payment verification failed.');
      }
    });
  }

  private loadRazorpayScript(): Promise<void> {
    if (typeof Razorpay !== 'undefined') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });
  }

  submitReview() {
    if (!this.myRating) return;
    this.reviewLoading.set(true);
    this.api.submitReview(this.note()!.id, this.myRating, this.myComment).subscribe({
      next: r => { this.reviewLoading.set(false); if (r.success) { this.reviewMsg.set('Review submitted! Thank you.'); this.loadReviews(this.note()!.id); } },
      error: () => this.reviewLoading.set(false)
    });
  }
}
