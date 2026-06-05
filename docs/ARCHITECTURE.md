# TopNotes — Architecture (At a Glance)

Concise map of how the whole system fits together. **Frontend:** Aman · **Backend:** Akshat.

---

## 1. System overview

```mermaid
flowchart LR
  U[User Browser] -->|HTTPS + JWT| FE[Angular 17 SPA]
  FE -->|REST /api| BE[Spring Boot API]
  BE -->|JPA/Hibernate| DB[(MySQL / Postgres)]
  BE -->|file storage| CL[(Cloudinary)]
  BE -->|payments| RP[(Razorpay)]
  BE -->|email| ML[(SMTP)]
```

| Layer | Tech | Owner |
|-------|------|-------|
| Frontend | Angular 17, signals, RxJS | **Aman** |
| Backend | Spring Boot 3.2, Spring Security + JWT, JPA | **Akshat** |
| Data | MySQL (local) / Postgres (Render) | Akshat |
| Infra | Cloudinary (files), Razorpay (pay), Render (deploy) | shared |

---

## 2. Auth flow (JWT)

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Angular
  participant API as Backend
  U->>FE: login(email, password)
  FE->>API: POST /auth/login
  API-->>FE: { token, user }
  FE->>FE: store token + user (signal)
  Note over FE: authInterceptor attaches<br/>Authorization: Bearer <token>
  FE->>API: GET /protected (with token)
  API->>API: JwtAuthFilter verifies + sets role
  API-->>FE: data (or 401 → force logout)
```

Roles: **ADMIN / SELLER / BUYER** — enforced by backend (`@PreAuthorize`) and mirrored on the client by route guards (UX only, not security).

---

## 3. Frontend architecture

```mermaid
flowchart TB
  subgraph features["features/ (pages)"]
    A[auth] --- B[buyer] --- S[seller] --- AD[admin]
  end
  subgraph shared["shared/ (reusable UI)"]
    NAV[navbar · button · card · modal · toast · table · empty · skeleton]
  end
  subgraph core["core/ (singletons)"]
    SVC[ApiService] --- AUTH[AuthService signals] --- G[guards] --- INT[interceptors] --- M[models]
  end
  features --> shared
  features --> core
  core --> HTTP[(HttpClient → Backend)]
```

**Data flow (one direction):** `Component → feature facade → ApiService → HttpClient → [auth + error interceptors] → API`, response → **signal** → view (`OnPush`).

**State & caching**
- UI/auth state → **signals** (`computed` for derived flags).
- Server reads → cache in a service signal / `shareReplay`; invalidate on related writes.
- Debounce search (`debounceTime`), cancel stale (`switchMap`).
- Lazy-load every feature route → small initial bundle.

---

## 4. Request lifecycle (cross-cutting)

```mermaid
flowchart LR
  C[Component] --> F[Feature service/facade]
  F --> AS[ApiService]
  AS --> AI[authInterceptor: add JWT]
  AI --> EI[errorInterceptor: 401→logout, toast]
  EI --> API[(Backend /api)]
  API --> EI --> AS --> SIG[signal] --> V[View OnPush]
```

---

## 5. Key domain flows

**Purchase**
```mermaid
flowchart LR
  BR[Browse] --> ND[Note detail] --> PAY[Razorpay checkout] --> VER[verify signature] --> P[Purchase + Earning + Notification] --> VIEW[Secure viewer]
```

**Seller verification**
```mermaid
flowchart LR
  T[MCQ test] -->|pass ≥70%| MK[Upload marksheet] --> ADM[Admin approve] --> SELL[Can publish notes]
```

---

## 6. End-to-end user journeys (per role)

### 6A. Buyer — register → read → review

```mermaid
flowchart TD
  R[Register as Buyer] --> L[Login]
  L --> BR[Browse: search / filter by class, subject, exam, price]
  BR --> ND[Open Note Detail + page-1 preview]
  ND --> Q{Buy?}
  Q -->|no| BR
  Q -->|yes| PAY[Razorpay checkout]
  PAY --> OK{Payment success?}
  OK -->|fail / cancel| ND
  OK -->|success| PUR[Purchase saved + invoice + notification]
  PUR --> VIEW[Read in secure watermarked viewer]
  VIEW --> REV[Leave rating + review]
  REV --> MP[My Purchases: re-read / download invoice]
  MP --> BR
```

### 6B. Seller — register → verify → sell → earn

```mermaid
flowchart TD
  R[Register as Seller] --> L[Login]
  L --> VER[Verification required to sell]
  VER --> TEST[Take MCQ academic test]
  TEST --> P{"Score >= 70%?"}
  P -->|fail| TEST
  P -->|pass| MK[Upload marksheet]
  MK --> WAIT[Awaiting admin approval]
  WAIT --> AD{Admin decision}
  AD -->|reject + reason| MK
  AD -->|approve| ACT[Verified seller]
  ACT --> UP[Upload note: PDF + details + price]
  UP --> LIVE[Note live in Browse]
  LIVE --> SALE[Buyer purchases note]
  SALE --> EARN[Earning credited ~65% + sale notification]
  EARN --> DASH[Dashboard: revenue charts, sales, ratings]
  DASH --> UP
  DASH --> PO[Request / receive payout]
```

### 6C. Admin — login → moderate → configure

```mermaid
flowchart TD
  L[Login as Admin] --> DASH[Dashboard: stats + pending approvals]
  DASH --> V[Verifications queue]
  V --> VD{Review seller test + marksheet}
  VD -->|approve| AV[Seller unlocked to sell]
  VD -->|reject + reason| RV[Seller notified to redo]
  DASH --> USR[User management]
  USR --> SUS[Suspend / activate buyers & sellers]
  DASH --> TST[Test manager]
  TST --> Qn[Add / edit / disable MCQs + test config]
  DASH --> CFG[Platform config]
  CFG --> COM[Set commission split, pass score, currency]
  DASH --> AN[Analytics: revenue, users, notes]
```

### 6D. How the three roles connect (marketplace loop)

```mermaid
flowchart LR
  S[Seller uploads verified notes] --> CAT[Catalogue / Browse]
  CAT --> B[Buyer purchases & reads]
  B --> MON[Revenue split]
  MON --> S
  A[Admin] -. verifies sellers .-> S
  A -. moderates users & config .-> CAT
```

---

## 7. Backend layering (brief)

```
Controller  →  Service (interface + impl)  →  Repository  →  Entity ↔ DB
            ↘ cross-cutting: Security (JWT filter) · GlobalExceptionHandler · DTOs (request/response)
```

Money in `BigDecimal`; commission split configurable; consistent `ApiResponse<T>` envelope.

---

## 8. Repo structure

```
backend/   ← Spring Boot API (Akshat)
frontend/  ← Angular SPA (Aman) — core / shared / features
docs/      ← this file + SETUP_GUIDE, audits, checklists, design prompts
render.yaml · README.md
```

> Frontend depends on the backend's REST contract only (the `ApiResponse<T>` + DTO shapes in `core/models`). Keep that contract as the single integration point between Aman and Akshat.
