# TopNotes Backend — Architecture & Code-Quality Audit

**Auditor:** Senior Software Engineer / Architect review (20+ yrs) · **Date:** 2026-06-02
**Canonical module:** `backend/`
**Stack:** Java 21, Spring Boot 3.2.5, Spring Security + JWT (jjwt 0.12.5), Spring Data JPA/Hibernate, MySQL (+ Postgres for Render), Lombok, springdoc 2.5.

## Executive summary

This is a genuinely well-structured Spring Boot application for its size: clean layered packaging, a consistent `ApiResponse<T>` envelope, a centralized `GlobalExceptionHandler`, BCrypt(strength 12), stateless JWT, parameterized JPQL, `BigDecimal` for money, sensible indexes, and `open-in-view=false`. The bones are solid and the author clearly understands Spring idioms. However, it is **not production-ready** as-is. The dominant problem is a **duplicated, divergent copy of the entire backend at the repo root** (`/src`, `/pom.xml`, `/target`, `/uploads`) that has already drifted from the canonical `backend/` module and carries a real correctness bug — a maintenance time-bomb. On top of that there are **hardcoded fallback secrets** committed to `application.properties`, a **public endpoint that leaks the full paid PDF** (defeating the entire paywall), verbose error/log leakage enabled in prod, and **zero tests**. The Postgres/MySQL concern is mostly handled correctly in the *canonical* module but is broken in the duplicate.

**Overall grade: C+** (would be B/B- without the root duplicate and the preview-leak; the paywall leak and committed secrets are what hold it back).

---

## ✅ What's done well

- **Clean layered package structure** under `com.topnotes`: `config/`, `controller/`, `service/` + `service/impl/`, `repository/`, `entity/` + `entity/enums/`, `dto/request` + `dto/response`, `security/`, `exception/`, `util/`. Easy to navigate and conventional.
- **Consistent response envelope.** Every controller returns `ResponseEntity<ApiResponse<T>>` with `success`/`message`/`data`/`timestamp`, `@JsonInclude(NON_NULL)` — see [ApiResponse.java](../backend/src/main/java/com/topnotes/dto/response/ApiResponse.java#L18-L47).
- **Centralized error handling** mapping domain exceptions to proper status codes (404/400/403/401/413/500) in [GlobalExceptionHandler.java](../backend/src/main/java/com/topnotes/exception/GlobalExceptionHandler.java#L30-L116), and it deliberately hides internal exception detail on the 500 path ([line 115](../backend/src/main/java/com/topnotes/exception/GlobalExceptionHandler.java#L115)).
- **Strong password hashing:** `new BCryptPasswordEncoder(12)` at [SecurityConfig.java#L120](../backend/src/main/java/com/topnotes/config/SecurityConfig.java#L120). Password column documented "never exposed" and is absent from response DTOs ([User.java#L41-L43](../backend/src/main/java/com/topnotes/entity/User.java#L41)).
- **Stateless JWT done correctly:** `SessionCreationPolicy.STATELESS`, CSRF disabled appropriately, jjwt 0.12.x API (`verifyWith`/`parseSignedClaims`), and signature/expiry handled per-exception-type in [JwtUtil.java#L89-L113](../backend/src/main/java/com/topnotes/security/JwtUtil.java#L89).
- **Money handled with `BigDecimal`** end-to-end: column `precision=10, scale=2` ([Note.java#L61-L62](../backend/src/main/java/com/topnotes/entity/Note.java#L61)) and commission split using `RoundingMode.HALF_UP` ([PurchaseServiceImpl.java#L85-L89](../backend/src/main/java/com/topnotes/service/impl/PurchaseServiceImpl.java#L85)).
- **Thoughtful indexing & lazy relations:** explicit `@Index` on hot columns ([Note.java#L22-L29](../backend/src/main/java/com/topnotes/entity/Note.java#L22), [User.java#L22-L25](../backend/src/main/java/com/topnotes/entity/User.java#L22)), all associations `FetchType.LAZY`, and `spring.jpa.open-in-view=false` ([application.properties#L24](../backend/src/main/resources/application.properties#L24)).
- **Transaction boundaries on the service layer** with read/write distinction — `@Transactional` on mutations, `@Transactional(readOnly = true)` on queries throughout [PurchaseServiceImpl.java](../backend/src/main/java/com/topnotes/service/impl/PurchaseServiceImpl.java#L131) and [NoteServiceImpl.java](../backend/src/main/java/com/topnotes/service/impl/NoteServiceImpl.java#L104).
- **Razorpay verification is implemented securely:** HMAC-SHA256 signature check with a **constant-time comparison** ([RazorpayPaymentService.java#L107](../backend/src/main/java/com/topnotes/service/impl/RazorpayPaymentService.java#L107), [#L174-L179](../backend/src/main/java/com/topnotes/service/impl/RazorpayPaymentService.java#L174)) and a graceful "demo" fallback when keys are absent.
- **File upload validation** (MIME allow-list + per-type size caps + UUID filenames) in [FileUploadUtil.java#L98-L114](../backend/src/main/java/com/topnotes/util/FileUploadUtil.java#L98); paid-PDF serving sets `no-store`, `nosniff`, `X-Frame-Options`, CSP headers ([NoteController.java#L188-L193](../backend/src/main/java/com/topnotes/controller/NoteController.java#L188)).
- **Ownership checks** on seller mutations via `findByIdAndSellerIdAndStatusNot` ([NoteServiceImpl.java#L215-L221](../backend/src/main/java/com/topnotes/service/impl/NoteServiceImpl.java#L215)) — prevents one seller editing another's notes (no IDOR there).
- **Defense-in-depth authz:** URL rules in `SecurityConfig` **plus** method-level `@PreAuthorize` on controllers (e.g. [AdminController.java#L34](../backend/src/main/java/com/topnotes/controller/AdminController.java#L34), [NoteController.java#L107](../backend/src/main/java/com/topnotes/controller/NoteController.java#L107)).

---

## ⚠️ Issues by severity

### 🔴 Critical

**C1 — Public "preview" endpoint serves the entire paid PDF (paywall bypass).**
`previewUrl` is set equal to `pdfUrl` (the full file) at [NoteServiceImpl.java#L90-L91](../backend/src/main/java/com/topnotes/service/impl/NoteServiceImpl.java#L90) with the comment "Backend serves page 1 in controller." It does not. The public, unauthenticated endpoint `GET /notes/{id}/preview` ([NoteController.java#L94-L102](../backend/src/main/java/com/topnotes/controller/NoteController.java#L94)) calls `servePdfInline(previewUrl, …)`, which streams **all bytes** via `readFileBytes` ([FileUploadUtil.java#L63-L69](../backend/src/main/java/com/topnotes/util/FileUploadUtil.java#L63)) — no page extraction anywhere. **Anyone can download every note in full for free**, defeating the core business model.
*Fix:* Generate a real 1-page preview artifact at upload time (e.g. extract page 1 with PDFBox into a separate file) and store its path in `previewUrl`; never point `previewUrl` at the full PDF. Until then, treat `/preview` as the leak it is.

**C2 — Hardcoded fallback secrets committed in `application.properties`.**
- JWT signing secret default: `topnotes-super-secret-key-...-2024` ([application.properties#L27](../backend/src/main/resources/application.properties#L27)).
- Cloudinary `cloud-name=dzd3ufne6` and `api-key=919386188755687` ([#L89-L90](../backend/src/main/resources/application.properties#L89)).
These are real-looking credentials in source control. The JWT fallback means that if `JWT_SECRET` is ever unset, the app boots with a publicly-known signing key → **anyone can mint admin tokens**. `render.yaml` does `generateValue: true` for `JWT_SECRET` ([render.yaml#L36-L37](../render.yaml#L36)), so prod-on-Render is okay, but the committed default is still a leaked credential and a latent footgun for any other environment.
*Fix:* Remove all literal fallbacks; fail fast if the env var is missing (no default). Rotate the exposed Cloudinary key. Add a startup assertion that `app.jwt.secret` length ≥ 32 bytes and is not the known default.

**C3 — Duplicated, divergent backend at repo root.**
The repo root contains a near-complete second copy of the application: `pom.xml`, `render.yaml`, and `src/main/java/com/topnotes/**` (76 of 78 classes duplicated). It has **already drifted** from `backend/`:
- Root `src` is **missing** `CloudinaryConfig.java` and `HealthController.java`.
- Root `pom.xml` is **missing** the PostgreSQL driver and the Cloudinary dependency (diff confirmed) — so the root copy cannot run on Render's Postgres at all.
- Root `NoteServiceImpl.java` has a **stale, buggy** `searchNotes` that passes the raw (possibly `null`) `keyword` straight to the query, whereas the canonical fixed it to normalize null→`""` ([NoteServiceImpl.java#L111-L113](../backend/src/main/java/com/topnotes/service/impl/NoteServiceImpl.java#L111)). The JPQL does `:keyword = ''` ([NoteRepository.java#L35](../backend/src/main/java/com/topnotes/repository/NoteRepository.java#L35)), so a null keyword in the root copy filters out everything.
- `CorsConfig`, `SecurityConfig`, `FileUploadUtil`, `TestQuestionRepository`, `TestManagementServiceImpl` also differ.
This guarantees future confusion about "which is real," and the divergence proves the risk is already realized.
*Fix:* Delete the root `src/`, root `pom.xml`, root `render.yaml`, and `target/` immediately; keep only `backend/` as the module. Add `src/` and root `target/`,`/uploads/` to `.gitignore`.

### 🟠 High

**H1 — `server.error.include-message=always` + binding errors in prod.**
[application.properties#L4-L5](../backend/src/main/resources/application.properties#L4) echoes exception messages and binding errors to clients for any error path not caught by the handler. Combined with leaking through the default error controller, this is information disclosure.
*Fix:* Set to `never` (or `on_param`) in the prod/render profile.

**H2 — `spring.jpa.hibernate.ddl-auto=update` in the committed (prod-facing) config.**
[application.properties#L19](../backend/src/main/resources/application.properties#L19). `update` in production silently mutates schema, never drops, and can deadlock or partially apply on startup. `application-render.properties` does **not** override it, so Render inherits `update` against Postgres ([application-render.properties](../backend/src/main/resources/application-render.properties#L1-L14) has no `ddl-auto` line).
*Fix:* Use `validate` in prod and manage schema with Flyway/Liquibase.

**H3 — Committed user-uploaded files and build artifacts.**
Both `uploads/` (root and `backend/`) contain real `pdfs/`, `marksheets/`, `thumbnails/`, and root `target/` (compiled classes, including `application.properties`) are present in the tree. `.gitignore` covers `target/` and `backend/target/` but **not** `/uploads/` nor the root `/src`. Marksheets are identity documents — committing them is a privacy/compliance problem.
*Fix:* Purge `uploads/` from the repo and `.gitignore` it; on Render the upload dir is `/tmp/...` (ephemeral) anyway ([render.yaml#L32-L33](../render.yaml#L32)) — note that local-disk storage is itself unsuitable for a stateless Render dyno (see M4).

**H4 — Validation failures returned as `success`.**
In the `MethodArgumentNotValidException` handler, the response is built with `ApiResponse.success("Validation failed: …", errors)` and HTTP 422 ([GlobalExceptionHandler.java#L87-L88](../backend/src/main/java/com/topnotes/exception/GlobalExceptionHandler.java#L87)). So the body says `success: true` on a 422 — clients keying off the `success` flag will misbehave. The author even left a "Better validation response using factory" comment ([#L91](../backend/src/main/java/com/topnotes/exception/GlobalExceptionHandler.java#L91)) acknowledging it.
*Fix:* Use a dedicated error payload (`ApiResponse.error(...)` carrying the field map) so `success=false`.

### 🟡 Medium

**M1 — JWT secret used without length/strength validation.**
`getSigningKey()` does `jwtSecret.getBytes()` with the platform default charset and feeds it straight to `Keys.hmacShaKeyFor` ([JwtUtil.java#L31-L33](../backend/src/main/java/com/topnotes/security/JwtUtil.java#L31)). A secret shorter than 256 bits throws at first sign; the default charset is non-deterministic across OSes.
*Fix:* `getBytes(StandardCharsets.UTF_8)`; validate ≥ 32 bytes at startup; consider Base64-decoding a configured key.

**M2 — Inconsistent transaction usage in the payment path / no duplicate-purchase constraint.**
`RazorpayPaymentService.createOrder/verifyAndComplete` have **no** `@Transactional` ([#L64](../backend/src/main/java/com/topnotes/service/impl/RazorpayPaymentService.java#L64), [#L94](../backend/src/main/java/com/topnotes/service/impl/RazorpayPaymentService.java#L94)); the write is delegated to `PurchaseServiceImpl.completePurchase`. The duplicate-purchase guard is a check-then-act (`existsBy…` then `save`) with **no unique constraint** on `(buyer_id, note_id)` — concurrent double-clicks can create two purchases and two earnings. The denormalized `purchaseCount++` ([PurchaseServiceImpl.java#L114](../backend/src/main/java/com/topnotes/service/impl/PurchaseServiceImpl.java#L114)) is read-modify-write without locking.
*Fix:* Add a DB unique constraint on `(buyer_id, note_id)` and handle the violation; consider an idempotency key on `transactionId`.

**M3 — N+1 in note listing.**
`searchNotes` maps each `Note` via `toResponse`, which for **every** note lazily loads `note.getSeller()` and runs `countBySellerId(...)` + `existsBy…` ([NoteServiceImpl.java#L171-L185](../backend/src/main/java/com/topnotes/service/impl/NoteServiceImpl.java#L171)). A page of 12 → dozens of extra queries.
*Fix:* `JOIN FETCH` the seller in the search query; batch the per-seller counts / purchased flags (or denormalize seller note-count).

**M4 — Local-filesystem storage incompatible with the deployment target.**
`FileUploadUtil` writes to a local directory ([#L85-L96](../backend/src/main/java/com/topnotes/util/FileUploadUtil.java#L85)). On Render free dynos the filesystem is **ephemeral** and `FILE_UPLOAD_DIR=/tmp/...` ([render.yaml#L32](../render.yaml#L32)) — every uploaded PDF/marksheet is lost on restart. Cloudinary is wired in (`CloudinaryConfig` exists only in `backend/`) but `FileUploadUtil` still uses disk.
*Fix:* Route storage through Cloudinary/S3 in all environments; disk impl should be dev-only.

**M5 — Mojibake / non-English comment + redundant CORS in a security file.**
[CorsConfig.java#L26](../backend/src/main/java/com/topnotes/config/CorsConfig.java#L26): `// Yeh line zaroori hai: …`. Also two CORS mechanisms coexist — a `CorsFilter` bean here **and** `http.cors(Customizer.withDefaults())` in `SecurityConfig` — redundant and invites drift.
*Fix:* Standardize on a single `CorsConfigurationSource` bean; remove the duplicate filter; clean the comment.

**M6 — Dead `seller-commission-percent` property.**
Platform/seller commission are two independent properties (`35`/`65`) ([application.properties#L44-L45](../backend/src/main/resources/application.properties#L44)) but only `platformCommissionPercent` is used; seller share is derived as `amount - platformShare` ([PurchaseServiceImpl.java#L89](../backend/src/main/java/com/topnotes/service/impl/PurchaseServiceImpl.java#L89)). The seller property can silently contradict the platform value.
*Fix:* Derive one from the other or validate they sum to 100 at startup.

### 🟢 Low

- **L1 — `logging.level.com.topnotes=DEBUG` in committed config** ([application.properties#L83](../backend/src/main/resources/application.properties#L83)); the JWT filter logs the authenticated email + path at DEBUG ([JwtAuthFilter.java#L57](../backend/src/main/java/com/topnotes/security/JwtAuthFilter.java#L57)). Lower to `INFO` in prod. The `render` profile does not override it.
- **L2 — `JwtAuthFilter` hits the DB on every authenticated request** (`loadUserByUsername`, [JwtAuthFilter.java#L48](../backend/src/main/java/com/topnotes/security/JwtAuthFilter.java#L48)) even though role + userId are already in the token claims. Building the principal from claims would avoid a query per request.
- **L3 — Two health surfaces** (`/health` controller at [SecurityConfig.java#L62](../backend/src/main/java/com/topnotes/config/SecurityConfig.java#L62), and `/actuator/health` at [#L74](../backend/src/main/java/com/topnotes/config/SecurityConfig.java#L74)) but `spring-boot-starter-actuator` is not in `pom.xml`, so the actuator rule is dead. Drop it or add the dependency.
- **L4 — `interface + single impl` for every service.** Acceptable, but with one implementation each it is ceremony with no current payoff except mockability for tests (which don't exist).
- **L5 — `HikariCP` max-pool-size=20** ([application.properties#L12](../backend/src/main/resources/application.properties#L12)) is too high for a Render free Postgres (low connection caps); tune per plan.

### 🧪 Testing

**There are no tests at all.** `backend/src/test/**` does not exist, despite `spring-boot-starter-test` and `spring-security-test` being declared in `pom.xml` ([#L96-L106](../backend/pom.xml#L96)). For a system that handles **payments, revenue splitting, and a content paywall**, zero coverage is a serious gap. Minimum bar: unit tests for `PurchaseServiceImpl` commission math and the duplicate-purchase guard, `RazorpayPaymentService` signature verification, and `@WebMvcTest`/`spring-security-test` slices asserting the authorization matrix in `SecurityConfig`.

### 🚀 Production-readiness — the Postgres/MySQL question (clarified)

The reported mismatch is **not present in the canonical `backend/` module**, but **is real in the root duplicate**:
- `backend/pom.xml` includes **both** `mysql-connector-j` and `org.postgresql:postgresql` ([backend/pom.xml#L52-L61](../backend/pom.xml#L52)).
- `application.properties` defaults to MySQL + `MySQL8Dialect` for local dev ([#L8-L21](../backend/src/main/resources/application.properties#L8)).
- `application-render.properties` correctly **overrides** URL, credentials, driver `org.postgresql.Driver`, and `PostgreSQLDialect` ([application-render.properties#L4-L9](../backend/src/main/resources/application-render.properties#L4)); `render.yaml` activates `SPRING_PROFILES_ACTIVE=render` ([render.yaml#L10-L11](../render.yaml#L10)) and provisions Postgres 17 ([#L53-L59](../render.yaml#L53)).
So the canonical module **does** address the dialect/driver switch. The **root `pom.xml` lacks the Postgres driver entirely** — building/deploying from the root (which also has its own `render.yaml`) fails on Render with "driver class not found." Another reason C3 is urgent. Residual prod gaps even for the canonical module: `ddl-auto=update` on Postgres (H2), no Flyway, ephemeral file storage (M4), and `include-message=always` (H1).

---

## 🎯 Top priorities (ranked)

1. **Fix the paywall leak (C1)** — stop serving the full PDF from the public `/preview`; generate a real single-page preview. Direct revenue/IP loss.
2. **Delete the root duplicate (C3)** — remove `/src`, root `/pom.xml`, root `/render.yaml`, `/target`, `/uploads`; `.gitignore` them. Eliminates the divergence and the missing-Postgres-driver landmine.
3. **Purge & rotate secrets (C2)** — remove hardcoded JWT/Cloudinary fallbacks, fail-fast on missing env vars, rotate the exposed Cloudinary API key.
4. **Lock down error/log leakage for prod (H1, L1)** — `include-message=never`, `include-binding-errors=never`, `logging.level=INFO` in the render profile.
5. **Schema safety (H2)** — switch prod to `ddl-auto=validate` and introduce Flyway.
6. **Purchase integrity (M2)** — unique constraint on `(buyer_id, note_id)` + idempotency to prevent double-charge/double-earning races.
7. **Fix the validation envelope (H4)** so 4xx responses are `success=false`.
8. **Add a baseline test suite** — payment math, signature verification, and the security authorization matrix at minimum.

---

## 🧭 Suggested target architecture / folder layout

The internal package layout is good and largely should be kept. The changes are about removing the duplicate and tightening prod config:

```
Top_Notes/
├─ backend/                      ← the ONLY backend module (delete root /src, /pom.xml, /render.yaml, /target, /uploads)
│  ├─ pom.xml                    ← keep both MySQL + Postgres drivers; consider adding actuator + flyway
│  ├─ src/main/java/com/topnotes/
│  │   ├─ config/                ← consolidate CORS into one CorsConfigurationSource; drop duplicate CorsFilter
│  │   ├─ controller/            ← thin; keep @PreAuthorize defense-in-depth
│  │   ├─ service/ + service/impl/   ← business logic stays here (good); keep @Transactional on all mutations
│  │   ├─ repository/            ← add JOIN FETCH variants to kill N+1; add unique constraints
│  │   ├─ entity/ + enums/
│  │   ├─ dto/request|response/  ← split a dedicated ErrorResponse from ApiResponse
│  │   ├─ security/              ← build principal from JWT claims (skip per-request DB hit)
│  │   ├─ storage/               ← NEW: StorageService interface; CloudinaryStorage (prod) + LocalDiskStorage (dev)
│  │   └─ exception/
│  ├─ src/main/resources/
│  │   ├─ application.properties           ← no secrets, no literal fallbacks
│  │   ├─ application-render.properties    ← add ddl-auto=validate, include-message=never, logging=INFO
│  │   └─ db/migration/                    ← NEW: Flyway V1__init.sql, ...
│  └─ src/test/java/com/topnotes/          ← NEW: payment, security-matrix, repository slice tests
├─ frontend/
├─ render.yaml                   ← single source of truth (currently duplicated at root + implied per-copy)
└─ .gitignore                    ← add /src, /target, /uploads
```

**Net:** strong fundamentals undermined by a duplicated codebase, a paywall hole, committed secrets, and no tests. Address the eight priorities above and this moves from "promising prototype" to "deployable B+."
