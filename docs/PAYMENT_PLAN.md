# Payment & Payout Plan — TopNotes

**Processor:** Cashfree (lower fee ~1.75%, split + Payouts API, Spring SDK).
**Model:** Collect → Ledger → Admin-triggered Payout (Plan B + Level 2). Auto-split (Cashfree
Easy Split / Vendor) and scheduled cron payouts are **Phase 2** (need seller KYC + scale).

> ## ✅ STATUS: BUILT + TESTED (sandbox, end-to-end)
> Aman built **both** backend and frontend (collect + payout + webhook). Verified in sandbox:
> buy → split 35/65 → seller Earning → withdraw → admin pay → **Cashfree Payouts PAID**
> (ref `666370351`) → ledger updated. Buyer checkout also tested in browser (test UPI → Read
> unlocked). Webhook tested with a signed payload (purchase recorded even if the tab closes).
> **Remaining = launch/deploy only:** Render egress IP whitelist for Payouts, live keys +
> business KYC, fund the Payouts balance, set the webhook URL in the Cashfree dashboard.

## Money flow (Phase 1)
```
Buyer pays ₹100  ──Cashfree PG (Checkout)──▶  Platform account
                                              │
                          DB ledger: Purchase.sellerShare (already stored)
                                              │
   Seller clicks "Withdraw" (balance ≥ min) ──▶  PayoutRequest (PENDING)
                                              │
   Admin reviews queue → "Pay" ──Cashfree Payouts API──▶  Seller UPI (PAID)
```

## Ownership / status (all built by Aman)
| Part | Status |
|---|---|
| **#6 Seller UPI field** | ✅ DONE (User.upiId + GET/PUT /profile/upi + UI on verification page) |
| Earnings ledger (`Purchase.sellerShare` + `Earning`) | ✅ in DB + summed for available balance |
| Seller **Earnings + Withdraw** UI | ✅ DONE (card on seller dashboard) |
| Admin **Payout queue** UI | ✅ DONE (/admin/payouts page + nav) |
| `PayoutRequest` entity + endpoints | ✅ DONE + tested |
| **Cashfree PG (collect)** Checkout | ✅ DONE + tested (browser too) |
| **Cashfree Payouts** (actual transfer) | ✅ DONE + tested (PAID, ref 666370351) |
| **Payment webhook** (reliability) | ✅ DONE + tested (signed payload → purchase recorded) |

## API contract — all implemented ✅
- `GET  /profile/upi` · `PUT /profile/upi` (validates VPA) ✅
- `GET  /seller/earnings` → `{ totalEarned, paidOut, inProgress, available, minWithdraw, upiSet }` ✅
- `POST /seller/payouts` (withdraw available balance) ✅
- `GET  /admin/payouts/pending` ✅
- `POST /admin/payouts/{id}/pay` → Cashfree Payouts → mark PAID/FAILED ✅
- `POST /buyer/payments/order/{noteId}` · `POST /buyer/payments/verify` (Cashfree PG collect) ✅
- `POST /payments/webhook/cashfree` (public, signature-verified) ✅

## PayoutRequest (suggested entity — Akshat)
`id, seller(FK), amount, upiId(snapshot), status(PENDING|PAID|FAILED), requestedAt, paidAt, cashfreeRef`

## Cashfree integration seam (Akshat)
One service method the rest of the system calls — keep it isolated:
```java
CashfreePayoutResult payout(String upiId, BigDecimal amount, String idempotencyKey);
```
Wire it to the Cashfree Payouts SDK with keys from env (`CASHFREE_*` in .env / Render).
Sandbox first; live mode needs platform business KYC.

## Caveats
- **Live mode** needs platform (business) KYC regardless. Test in **sandbox**.
- **Cashfree PG vs Payouts** are separate products — enable both; fund the Payouts balance.
- **Refunds** simpler in collect-model (platform holds funds). Keep self-purchase block.
- **RBI/legal:** holding seller funds is fine at small scale; move to auto-split (Phase 2) as it grows.
