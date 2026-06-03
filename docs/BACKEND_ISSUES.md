# Backend — Issues to Fix (Engineer Handoff)

> Source: full analysis in [BACKEND_AUDIT.md](BACKEND_AUDIT.md). This is the condensed, actionable checklist.
> Module to work in: **`backend/`** (the canonical one). Severity: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low.

---

## 🔴 Critical — do first

- [ ] **BE-1 · Paywall leak: `/preview` serves the full paid PDF.**
  `previewUrl` is set equal to `pdfUrl`, and `GET /notes/{id}/preview` (public) streams *all* bytes.
  Files: `service/impl/NoteServiceImpl.java#L90`, `controller/NoteController.java#L94`, `util/FileUploadUtil.java#L63`.
  **Fix:** At upload, generate a real 1-page preview (e.g. PDFBox extract page 1) into a separate file; store *that* path in `previewUrl`. Never point preview at the full PDF.

- [ ] **BE-2 · Hardcoded secrets committed in `application.properties`.**
  JWT fallback key (`#L27`) + Cloudinary `cloud-name`/`api-key` (`#L89-L90`).
  **Fix:** Remove all literal fallbacks; fail fast if env var missing. **Rotate the exposed Cloudinary key.** Assert `app.jwt.secret` ≥ 32 bytes and ≠ known default at startup.

- [ ] **BE-3 · Duplicate, divergent backend at repo root.**
  Root `/src`, `/pom.xml`, `/render.yaml`, `/target` are a second copy that has already drifted (stale search bug, missing Postgres driver).
  **Fix:** Delete root `/src`, root `/pom.xml`, root `/render.yaml`, `/target`. Keep only `backend/`. Add them to `.gitignore`.

---

## 🟠 High

- [ ] **BE-4 · Error detail leaks to clients in prod.**
  `server.error.include-message=always` + `include-binding-errors=always` (`application.properties#L4-L5`).
  **Fix:** Set both to `never` in the prod/`render` profile.

- [ ] **BE-5 · `ddl-auto=update` against prod DB.**
  `application.properties#L19`; not overridden in `application-render.properties`.
  **Fix:** Prod → `validate`; introduce **Flyway/Liquibase** migrations (`db/migration/V1__init.sql`).

- [ ] **BE-6 · Committed user uploads + build artifacts.**
  `uploads/` (real PDFs, **marksheets = ID documents**, thumbnails) and root `target/` are in the tree.
  **Fix:** Purge from repo; `.gitignore` `/uploads`. (See BE-9 for real storage.)

- [ ] **BE-7 · Validation errors return `success: true` on HTTP 422.**
  `exception/GlobalExceptionHandler.java#L87`.
  **Fix:** Return a proper error payload (`success=false`) carrying the field-error map.

---

## 🟡 Medium

- [ ] **BE-8 · No duplicate-purchase safety / payment txn gaps.**
  Check-then-act guard with no DB constraint; `purchaseCount++` is read-modify-write.
  Files: `service/impl/PurchaseServiceImpl.java#L114`, `service/impl/RazorpayPaymentService.java#L94`.
  **Fix:** Add **unique constraint on `(buyer_id, note_id)`** and handle the violation; add idempotency on `transactionId`; ensure the whole complete-purchase flow is one transaction.

- [ ] **BE-9 · Local-disk storage breaks on Render (ephemeral FS).**
  `util/FileUploadUtil.java#L85`; Cloudinary is wired but unused.
  **Fix:** Introduce a `StorageService` interface → `CloudinaryStorage` (prod) + `LocalDiskStorage` (dev).

- [ ] **BE-10 · N+1 on note listing.**
  `toResponse` lazily loads seller + runs count/exists per note. `service/impl/NoteServiceImpl.java#L171`.
  **Fix:** `JOIN FETCH` seller in the search query; batch per-seller counts / purchased flags.

- [ ] **BE-11 · JWT secret: charset + strength not validated.**
  `security/JwtUtil.java#L31` uses `getBytes()` (platform default charset).
  **Fix:** `getBytes(StandardCharsets.UTF_8)`; validate length at startup (ties into BE-2).

- [ ] **BE-12 · Redundant CORS + non-English comment in security file.**
  `CorsFilter` bean in `config/CorsConfig.java` **and** `http.cors()` in `SecurityConfig`.
  **Fix:** One `CorsConfigurationSource` bean; remove the duplicate filter; clean the comment (`#L26`).

- [ ] **BE-13 · Dead `seller-commission-percent` property.**
  Only platform % is used; seller share derived as `amount − platformShare`.
  **Fix:** Derive one from the other or validate they sum to 100 at startup.

---

## 🟢 Low

- [ ] **BE-14 · `logging.level.com.topnotes=DEBUG` in prod** (`application.properties#L83`); JWT filter logs email+path. → `INFO` in `render` profile.
- [ ] **BE-15 · `JwtAuthFilter` hits the DB every request** (`security/JwtAuthFilter.java#L48`). → Build principal from token claims.
- [ ] **BE-16 · Dead `/actuator/health` rule** (`SecurityConfig.java#L74`) — actuator dep not present. → Remove rule or add dependency.
- [ ] **BE-17 · Hikari `max-pool-size=20`** too high for Render free Postgres → tune per plan.
- [ ] **BE-18 · `interface + single impl` everywhere** — fine, but only pays off once tests exist.

---

## 🧪 Cross-cutting — Testing (currently ZERO)

- [ ] **BE-T1 ·** Unit-test `PurchaseServiceImpl` commission math + duplicate-purchase guard.
- [ ] **BE-T2 ·** Unit-test `RazorpayPaymentService` HMAC signature verification.
- [ ] **BE-T3 ·** `@WebMvcTest` + `spring-security-test` slices asserting the `SecurityConfig` authorization matrix (who can hit admin/seller/buyer routes).

---

### Suggested order of work
`BE-1 → BE-3 → BE-2` (critical) → `BE-4, BE-5, BE-7` (prod safety) → `BE-8` (payment integrity) → `BE-9, BE-10` → rest → tests alongside each fix.
