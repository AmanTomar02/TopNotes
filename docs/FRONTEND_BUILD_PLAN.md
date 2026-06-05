# Frontend Rebuild — Build Plan & Structure

Fresh, premium frontend. **Keep** the proven integration layer (`core/`); **rebuild** everything visual. Pages migrate one at a time so the app keeps running.

---

## Target folder structure

```
frontend/src/
├─ styles/                     ← global style layer (NEW)
│   ├─ tokens.css              design + motion tokens (CSS variables)
│   ├─ base.css                reset, fonts, element defaults, a11y
│   ├─ utilities.css           layout + helper classes
│   ├─ animations.css          keyframes + skeleton
│   └─ legacy.css              old styles — deleted as pages migrate
├─ styles.css                  ← just imports the partials above
└─ app/
    ├─ core/                   ← KEEP AS-IS (backend contract)
    │   ├─ models/  services/  guards/  interceptors/
    ├─ shared/                 ← reusable, dumb, OnPush
    │   ├─ ui/                 button, card, badge, input, modal, toast,
    │   │                       table, avatar, rating, tabs, skeleton,
    │   │                       empty-state, pagination, dropzone, stat-card, note-card
    │   ├─ animations/         reusable Angular animation triggers
    │   ├─ directives/  pipes/
    ├─ layout/                 ← app shell: topbar, sidebar, shell
    └─ features/               ← rebuilt pages (auth · buyer · seller · admin)
```

**Path aliases:** `@core` `@shared` `@ui` `@layout` `@features` `@animations` `@env`.

---

## Build order

**Phase 0 — Foundation** ✅ (this step)
Tokens + motion system · premium font · base/reset · utilities · animation triggers · the Button pattern.

**Phase 1 — Shared UI kit** (build before pages)
button · input/select/textarea · card · badge/chip · avatar · star-rating · tabs · modal · toast (+ service) · skeleton · empty-state · pagination · dropzone · stat-card · note-card · data-table.

**Phase 2 — Layout/shell**
topbar + role-aware sidebar/nav + animated active state + page container with route transition.

**Phase 3 — Pages** (each replaces the legacy one, then delete legacy)
1. Auth (Login, Register) — proves the system
2. Browse → Note detail → Secure viewer
3. My Purchases
4. Seller: Dashboard → Upload → My Notes → Verification
5. Admin: Dashboard → Users → Verifications → Config → Test Manager

**Phase 4 — Cleanup**
Delete `styles/legacy.css` + old component remnants; add error interceptor + toast; caching on list reads; OnPush everywhere; ESLint + tests.

---

## Premium + animation rules

- **Motion tokens:** `--dur-fast 120ms` · `--dur-base 180ms` · `--dur-slow 280ms`; easings `--ease-out` (enter), `--ease-standard` (move), `--ease-in` (exit).
- **Tooling:** `@angular/animations` for route + enter/leave; CSS transitions for hover/press. No heavy libs.
- **Animate:** route transitions, card hover-lift, button press, modal/toast in-out, skeleton shimmer, list stagger, tab/accordion slide, dashboard count-up + chart draw-in.
- **Always** wrap motion in `@media (prefers-reduced-motion: reduce)` → near-zero.
- **Premium = restraint:** whitespace, one radius/shadow language, indigo + amber accent only, great empty/loading states. Smooth > flashy.

## Engineering rules (carried from FRONTEND_CHECKLIST)
- Shared components: standalone, **OnPush**, signal `input()/output()`.
- One **ApiService**; add **error interceptor + toast**; **cache** list reads (service signals / `shareReplay`), invalidate on writes.
- No `any`; reuse `core/models`. Build primitives first, assemble pages from them.

> Tokens in `styles/tokens.css` are seeded from the design-system prompt (indigo + amber, Plus Jakarta Sans). **Swap those ~10 values to match your final design** — the whole UI keys off them.
