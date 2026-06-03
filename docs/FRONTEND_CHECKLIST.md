# Frontend Excellence Checklist — Industry-Level Standard

> Your north star for making the TopNotes frontend best-in-class across **architecture, design, UX, security, responsiveness, performance, accessibility, and quality**.
> Items marked **[fix]** are existing problems found in the current code (see [FRONTEND_AUDIT.md](FRONTEND_AUDIT.md)). Items without are standards to uphold.

---

## 1. 🏛️ Architecture & Code Structure

- [ ] Keep the **`core` / `shared` / `features`** split; features grouped by domain (auth/buyer/seller/admin).
- [ ] **One HTTP layer only** — every component uses `ApiService`. **[fix]** `AdminTestManagerComponent` bypasses it with raw `HttpClient` + duplicate types.
- [ ] **Single source of truth for models** in `core/models`. **[fix]** Remove locally-redefined `TestConfig`/`TestQuestion`.
- [ ] **Lazy-load** every feature route (already done — keep it).
- [ ] **`templateUrl` + `styleUrls`** for every component. **[fix]** Move all inline mega-templates/styles out of `.ts` (worst: `admin-test-manager` 792 lines).
- [ ] Components stay **thin** (presentation + light orchestration); logic lives in services.
- [ ] Extract repeated UI into **shared presentational components**: spinner, empty-state, pagination, toast, confirm-dialog, star-rating, file-dropzone.
- [ ] Consistent file/naming conventions; one component per file; barrel exports where helpful.

## 2. 🔄 State Management & Reactivity

- [ ] **Signals** for component/UI state (already used — standardize everywhere).
- [ ] Server cache/shared state via services exposing **readonly signals** or RxJS; derive with `computed()`.
- [ ] **`ChangeDetectionStrategy.OnPush`** on all components. **[fix]** None use it today; with signals it's nearly free.
- [ ] No memory leaks: use `takeUntilDestroyed()` / `async` pipe / `effect()`. **[fix]** Clear `setTimeout`/`setInterval` debounce timers in `ngOnDestroy`.
- [ ] **[fix]** Replace the `setInterval` chart-canvas polling with `effect()` / `afterNextRender`.
- [ ] **[fix]** Avoid app-wide CD churn — the navbar `window:scroll` `@HostListener` should be throttled / `OnPush`-isolated.

## 3. 🌐 HTTP, Errors & Loading States

- [ ] **Global error interceptor** **[fix]** — none exists. Handle `401 → logout+redirect`, `403`, `5xx`, network errors centrally.
- [ ] **Toast/notification service** **[fix]** — replace `alert(...)` calls.
- [ ] Every async call has **loading + error + empty** states. **[fix]** Several subscriptions have no `error` arm → stuck spinners.
- [ ] Always clear `loading` in **both** `next` and `error`.
- [ ] Retry/timeout strategy for idempotent GETs; disable buttons during in-flight mutations (prevent double-submit).
- [ ] Optimistic UI only where safe, with rollback on failure.

## 4. 🔐 Security (client-side)

- [ ] **[fix]** Don't store JWT in `localStorage` (XSS-stealable) → prefer **HttpOnly+Secure+SameSite cookie**; if not possible, short TTL + strict CSP.
- [ ] **[fix]** Stop treating client "content protection" as security — the PDF blob is fully exfiltratable. Real protection is **server-side** (paged, per-user-watermarked render, signed short-lived URLs). Don't advertise "download disabled" as a guarantee.
- [ ] Never trust client-side role guards for authorization — they're UX only; the server must enforce.
- [ ] Avoid `innerHTML` / `bypassSecurityTrust*` unless content is fully trusted; sanitize otherwise. **[fix]** Audit the watermark `innerHTML`.
- [ ] Add a **Content-Security-Policy** (and `X-Frame-Options`/referrer policy) via host config.
- [ ] No secrets/keys in frontend code or env files; `environment.prod.ts` holds only public URLs.
- [ ] Validate + sanitize all user input client-side (defense in depth) — file type/size before upload.

## 5. 🎨 Design System & Visual Quality

- [ ] **Design tokens** (colors, spacing, radius, shadows, typography scale) centralized — your `styles.css` already has good ones; build everything on them.
- [ ] **No ad-hoc inline `style="..."`** **[fix]** — promote to utility classes / component styles.
- [ ] Consistent **component library**: buttons (variants/sizes/states), inputs, selects, cards, modals, badges, tabs, tables — one canonical style each.
- [ ] Defined states for every interactive element: default / hover / focus / active / disabled / loading / error.
- [ ] Consistent **spacing & alignment** (8pt grid), visual hierarchy, and iconography (one icon set).
- [ ] **Dark mode** ready via CSS variables (optional but expected at top tier).
- [ ] Empty states, skeleton loaders, and error illustrations — not blank screens.

## 6. 📱 Responsiveness & Layout

- [ ] **Mobile-first**; verify at 320 / 375 / 768 / 1024 / 1440 widths.
- [ ] Fluid layouts with **CSS Grid/Flexbox**; avoid fixed pixel widths; use `clamp()` for type.
- [ ] Responsive navigation (hamburger/drawer on mobile), tables → cards on small screens.
- [ ] Touch targets ≥ 44px; no hover-only interactions on touch.
- [ ] Test landscape, large fonts, and `prefers-reduced-motion`.
- [ ] No horizontal scroll; content reflows, images are responsive (`srcset`/aspect-ratio).

## 7. ♿ Accessibility (WCAG 2.1 AA)

- [ ] **[fix]** Clickable `div`s with `routerLink` → real `<a>`/`<button>` (keyboard-focusable, correct roles).
- [ ] **[fix]** `aria-label`s on icon buttons, star ratings, dropzones.
- [ ] **[fix]** Color contrast ≥ 4.5:1 (audit low-opacity text like the viewer footer).
- [ ] Visible focus rings; full keyboard navigation; logical tab order; focus trap in modals.
- [ ] Form fields have associated `<label>`s + inline error messaging tied via `aria-describedby`.
- [ ] Semantic HTML, landmark regions, alt text, live regions for toasts.
- [ ] Run **axe / Lighthouse a11y** in CI.

## 8. 🚀 Performance

- [ ] Initial bundle lean; lazy chunks per route (already good — watch budgets in `angular.json`).
- [ ] **`OnPush`** + signals to minimize change detection.
- [ ] Images: modern formats (WebP/AVIF), lazy-loading, correct sizing, CDN.
- [ ] Defer heavy libs (chart.js already dynamically imported — keep that pattern).
- [ ] `trackBy` / `@for track` on all lists; virtualize long lists.
- [ ] Debounce search inputs (use RxJS `debounceTime`); cancel stale requests (`switchMap`).
- [ ] Target **Lighthouse ≥ 90** (Performance, A11y, Best-Practices, SEO); monitor Core Web Vitals.
- [ ] Caching/HTTP strategy for repeat GETs; preconnect to API origin.

## 9. 🧭 UX & Interaction

- [ ] Clear feedback for every action (loading, success, error toasts).
- [ ] Confirmations for destructive actions (delete note, suspend user) via a shared confirm dialog.
- [ ] Form UX: inline validation, helpful errors, disabled submit until valid, preserve input on error.
- [ ] **Reactive Forms (typed)** for non-trivial forms **[fix]** (currently template-driven `ngModel`).
- [ ] Sensible defaults, autofocus, `Enter`-to-submit, autocomplete attributes.
- [ ] Pagination/filtering/sorting state reflected in the URL (shareable, back-button-friendly).
- [ ] Persist scroll position / unsaved-change warnings where relevant.
- [ ] Consistent navigation, breadcrumbs where depth warrants, active-route highlighting.
- [ ] Friendly 404 / unauthorized / error pages.

## 10. 🔡 Type Safety & Tooling

- [ ] **`strict` TypeScript** is on — keep it. **[fix]** Eliminate `any` (API verification endpoints, `signal<any>`, `as any`, Razorpay).
- [ ] **[fix]** Add **ESLint** (`@angular-eslint`) + template a11y rules; fail CI on errors.
- [ ] Add **Prettier** + `.editorconfig`; format on commit.
- [ ] **[fix]** Fix all build warnings (the NG8107 redundant `?.` chains).
- [ ] Pre-commit hooks (husky + lint-staged) running lint/format/test.
- [ ] Type all API responses; no implicit `any`; enable `noUnusedLocals`/`noUnusedParameters`.

## 11. ✅ Testing

- [ ] **[fix]** Add a test runner (Jasmine/Karma or Jest) — `ng test` currently has no deps.
- [ ] Unit tests for **guards, interceptors, `AuthService` token logic** (highest-risk first).
- [ ] Component tests for critical flows (login, purchase, upload, admin approve).
- [ ] **E2E** (Playwright/Cypress) for the core journeys: register → browse → buy → view → review; seller verify; admin approve.
- [ ] Coverage gate in CI; visual-regression tests for the design system (optional, top tier).

## 12. 🌍 Production-Readiness & DX

- [ ] Environments clean: `environment.ts` (local) vs `environment.prod.ts` (Render URL) — no secrets.
- [ ] CI pipeline: install → lint → test → build → deploy; PR previews.
- [ ] Error monitoring (Sentry) + analytics; source maps for prod debugging.
- [ ] SEO/meta tags, favicon, social cards, `robots.txt` (consider SSR/SSG via Angular Universal if SEO matters).
- [ ] i18n-ready structure if multi-language is on the roadmap (notes are India-focused).
- [ ] README with run/build/deploy instructions; document the component library (Storybook = top tier).
- [ ] PWA/offline support (optional) for the study-notes reading experience.

---

## 🎯 Suggested first wave (highest impact for "industry-level")
1. **Error interceptor + toast service** and fix all loading/error states (§3).
2. **Extract templates/styles** to files and build a real **component library + design tokens** (§1, §5).
3. **`OnPush` + signals** everywhere; kill `any`; add **ESLint/Prettier** (§2, §10).
4. **Accessibility pass** (semantics, focus, contrast, aria) (§7).
5. **Responsive audit** at all breakpoints (§6).
6. **Move JWT off `localStorage`** + CSP; stop relying on client content-protection (§4).
7. **Stand up testing** (unit for guards/interceptor/auth, E2E for core flows) (§11).
