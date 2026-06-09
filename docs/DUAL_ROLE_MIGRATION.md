# Dual-Role Migration — "A buyer can sell, a seller can buy"

**Goal:** Any user can **both buy notes and sell notes**. Today the app is locked to one
role per user (a BUYER cannot upload, a SELLER cannot purchase — backend returns 403).

**Owners:** Backend = **Akshat**, Frontend = **Aman**.

> ## ✅ STATUS: IMPLEMENTED (role-upgrade hybrid — simpler than the full plan below)
> Aman implemented a **lower-risk variant** that leaves the admin/verification machinery untouched
> (the pending-approvals query still keys on `role='SELLER'`):
> - **A seller can buy** → buying relaxed to `hasAnyRole('BUYER','SELLER')` in
>   `BuyerController`, `NoteController` (`/notes/{id}/view`), and `SecurityConfig`
>   (`/buyer/**`, `/notes/{id}/view`).
> - **A buyer can sell** → new `POST /profile/become-seller` (`ProfileController` +
>   `AuthService.becomeSeller`) flips the role to `SELLER` and **re-issues the JWT**; the user then
>   completes the existing verification flow (publishing still gated on `isVerified`).
> - **Frontend:** `auth.service` gained `canBuy`/`canSell`/`isVerified` + a `becomeSeller()` call;
>   the app-shell now drives nav via independent body classes `is-buyer`/`is-seller`/`is-admin`
>   (so a seller sees **both** Browse/Purchases and Upload/My-Notes); buyers get a
>   "Become a seller" CTA; `/my-purchases` and `/notes/:id/view` now allow `['BUYER','SELLER']`.
>
> Verified: backend compiles + boots, smoke test confirms a seller can hit buyer endpoints and the
> upgrade flips the role, frontend builds clean, 25/25 unit tests pass.
> The full `Set<UserRole>` capability refactor below remains the option if you later want a pure
> roles-set model.

> **Good news (no transactional migration):** the data layer is already role-neutral.
> `User` already holds both `notes` (as seller) and `buyerPurchases` (as buyer) collections,
> and `Note.seller` / `Purchase.buyer` are independent FKs to the same `users` table
> (`User.java:93-99`, `Purchase.java:40-54`). Only the **role gate** blocks dual use, and
> `users.role` is the only column that needs rethinking. **No notes/purchases tables change.**

---

## Recommended design — Capability-based (least churn, zero data migration)

Instead of making roles mutually exclusive, model **capabilities**:

| Capability | Who has it | Gate |
|---|---|---|
| **Buy** a note | every authenticated, non-admin user | `isAuthenticated()` (own note still blocked) |
| **Sell / upload** a note | any user who passed the existing verification flow | `user.isVerified == true` |
| **Admin** | admins | `hasRole('ADMIN')` (unchanged) |

So "becoming a seller" = **completing the verification flow** (test + marksheet), which already
exists and already lives on `User` (`isVerified`, `testPassed`, `marksheetUrl` — `User.java:63-90`).
A buyer who wants to sell just verifies; a seller can already buy once the gate is relaxed.

**Why this over `Set<UserRole>`:** no `user_roles` join table, no backfill migration, no JWT
schema change. The `role` column stays only to distinguish **ADMIN vs regular USER**; the
BUYER/SELLER split becomes capability-driven. (Textbook `Set<UserRole>` alternative is in the
last section if Akshat prefers explicit RBAC.)

---

## Backend changes (Akshat)

### 1. Open **buying** to all authenticated users
`BuyerController.java:32` — the class-level `@PreAuthorize("hasRole('BUYER')")` is the blocker.
- Change to `@PreAuthorize("isAuthenticated()")` (or `hasAnyRole('BUYER','SELLER')`).
- Keep the self-purchase guard as-is — `PurchaseServiceImpl.java:80` (`seller.id != buyer.id`).
  A dual-role user must still never buy their **own** listing (it would skew earnings/counts).

### 2. Gate **selling** on verification, not on role
- `NoteController` upload `POST /notes` (`NoteController.java:130`): change
  `@PreAuthorize("hasRole('SELLER')")` → `@PreAuthorize("isAuthenticated()")` **and** enforce
  `isVerified` inside the service (return 403 "Complete seller verification first" if not).
- `SellerController.java:31` (dashboard / my-notes / sales / verification): change the
  class-level `hasRole('SELLER')` → `@PreAuthorize("isAuthenticated()")`. The verification
  sub-endpoints **must stay reachable for everyone** so a buyer can start verifying.
- `/notes/{id}/view` full-PDF (`NoteController.java:107`, currently `hasRole('BUYER')`): change to
  `isAuthenticated()` and verify in the service that **this user purchased the note** (ownership
  check, which is the real rule — not the role).

### 3. Mirror the path rules in SecurityConfig
`SecurityConfig.java:77-91` currently double-gates by role:
- `/seller/**` → was SELLER; make `authenticated()`.
- `/buyer/**` → was BUYER; make `authenticated()`.
- `POST/PATCH/DELETE /notes` → was SELLER; make `authenticated()` (service enforces `isVerified`).
- `GET /notes/{id}/view` → was BUYER; make `authenticated()` (service enforces purchase ownership).
- `/admin/**` → leave as `hasRole('ADMIN')`.

### 4. Add a "start selling" entry point (optional but recommended)
Today nothing lets a buyer opt into selling. The verification flow already exists; just make sure
its endpoints (`GET/POST /seller/verification/*`) are reachable by any authenticated user (step 2).
No new role-mutation endpoint is needed in the capability model — verification *is* the upgrade.

### 5. JWT — usually no change needed
Because we stop branching on BUYER/SELLER in authz, the single `role` claim
(`JwtUtil.java:48`) and single authority (`CustomUserDetails.java:30`) can stay. The only thing
the token must reflect for the UI is **`isVerified`** so the frontend can show seller features —
add `isVerified` to the auth/login response (and ideally re-issue the token or refresh the user
after verification is approved, so the user doesn't stay "unverified" in the client).

> ⚠️ **Token staleness:** if `isVerified` is read from the JWT, a freshly-verified user keeps the
> old value until re-login/refresh. Either re-mint the token on approval, or have the client
> re-fetch `/seller/verification/status` (already exists) to learn verified state live.

### Backend test checklist
- [ ] A SELLER-registered user can `POST /buyer/purchase/{id}` (someone else's note) → 200.
- [ ] A BUYER-registered user **cannot** upload until verified → 403; after verification → 200.
- [ ] No user can buy their own note → still 403 (self-purchase guard).
- [ ] `/notes/{id}/view` returns the PDF only to a user who purchased it, regardless of role.
- [ ] Admin endpoints unaffected.

---

## Frontend changes (Aman)

The nav already contains every section — they're just hidden by a single `body[data-role]`.
Switch from "one role" to "capabilities".

### 1. `auth.service.ts`
- Persist & expose **`isVerified`** from the login/auth response.
- Add capability signals: `canBuy = isAuthenticated && !isAdmin`, `canSell = isVerified`.
- `navigateAfterLogin` (`auth.service.ts:60-65`): admins → admin dashboard; everyone else →
  `/browse` (the universal home). Drop the BUYER/SELLER branch.

### 2. `auth.guard.ts`
- `roleGuard` already takes an array and checks membership. Repoint buyer/seller routes to
  **capability guards** instead: e.g. a `verifiedGuard` for `/seller/**` (redirect to the
  verification page if `!isVerified`), and plain `authGuard` for `/my-purchases` & `/notes/:id/view`.

### 3. `app.routes.ts`
- `/my-purchases`, `/notes/:id/view`: `roleGuard(['BUYER'])` → `authGuard` only.
- `/seller/**`: `roleGuard(['SELLER'])` → `authGuard` + `verifiedGuard` (verification page itself
  stays reachable without being verified).
- `/admin/**`: unchanged.

### 4. `app-shell.component.ts` (file is open in your IDE)
- Replace the single `roleAttr` (`app-shell.component.ts:509-516`) + `body[data-role]` driver
  with **independent flags**, e.g. set body classes `is-buyer`, `is-seller`, `is-admin`
  based on capabilities (a non-admin user gets **both** `is-buyer` and, if verified, `is-seller`).
- Update `app.css` selectors (`app.css:40-42` and the mobile `app.css:112-114`) from
  `body[data-role="buyer"] .nav-section.buyer { display:flex }` to
  `body.is-buyer .nav-section.buyer { display:flex }` etc. Now Browse/Purchases **and**
  Upload/My-Notes can show together.
- For an **unverified** user, show the seller section as a single "Become a seller →" link
  pointing at `/seller/verification` instead of the full seller nav.
- `home()` / `roleLabel` ternaries: make precedence admin → else `/browse`.

### 5. `register.component.ts`
- Keep the buyer/seller choice as a **starting intent** (it just sets the default landing), but the
  account is no longer locked to it. A "Topper" choice can route into verification after signup.

### Frontend test checklist
- [ ] A non-admin user sees **both** Browse/Purchases and (after verifying) Upload/My-Notes navs.
- [ ] Unverified user sees a "Become a seller" CTA, not a broken upload page.
- [ ] Seller can open `/browse`, buy a note, and see it under My Purchases.
- [ ] Guards redirect unverified users hitting `/seller/upload` to the verification page.

---

## Alternative — explicit `Set<UserRole>` (if Akshat prefers classic RBAC)

If you want roles to be explicit rather than capability-driven:
1. `User.role` (`User.java:53`) → `@ElementCollection @Enumerated(STRING) Set<UserRole> roles`
   (or a `user_roles` join table). **Requires a one-time backfill** of each existing user's single
   role into the set.
2. JWT emits a `roles` list (`JwtUtil.java:48`); build one `SimpleGrantedAuthority` per role
   (`CustomUserDetails.java:30`). All existing `hasRole(...)` checks keep working.
3. Move class-level `@PreAuthorize` to method level / `hasAnyRole`, same as steps 1-3 above.
4. Add a "become a seller" endpoint that adds `SELLER` to the set (post-verification) and
   **re-issues the JWT**.
5. Admin `getUsers(role)` filter (`AdminController.java:63`) and the `idx_user_role` index
   (`User.java:24`) move to a join-table query.

**Trade-off:** more explicit & future-proof, but carries the data migration + JWT schema change
that the capability model avoids. For a 2-person project shipping fast, **capability-based is the
recommended path.**

---

## Shared edge cases (both sides)
- **Self-purchase** stays blocked — keep `PurchaseServiceImpl.java:80`.
- **Stale token** after verification — re-mint JWT or re-fetch verification status.
- **Dual dashboard UX** — a verified buyer-seller now has both worlds; `/browse` is the shared home,
  and the sidebar shows both sections. No separate "switch account" mode needed.
- **Earnings/counts** — unaffected; they already key off Purchase/Note FKs, not role.
