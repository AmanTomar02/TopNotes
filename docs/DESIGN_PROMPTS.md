# TopNotes — Page-by-Page Design Prompts

For **Claude Design / ChatGPT Design** (or v0/Figma AI). Generates the new frontend UI screen by screen.

## How to use
1. **Paste Prompt 0 (Design System) first** — it sets brand, tokens, and the shared component kit.
2. Then paste any **page prompt** below. Each assumes the design system from Prompt 0.
3. Keep the **same shared components** across pages (reusability is the #1 goal — see note at the end).
4. After each generation, ask the tool to also output **mobile (375px)** and the **empty / loading / error** states.

---

## Prompt 0 — Design System (paste this first)

> You are designing **TopNotes**, a premium marketplace where verified topper students sell handwritten study notes (PDFs) to JEE/NEET/Board aspirants in India. Audience: students 16–22 + an admin. Tone: **trustworthy, academic, premium, modern** — think "Linear/Stripe polish meets edtech warmth." Not childish, not corporate-cold.
>
> **Brand & tokens**
> - Primary: deep indigo `#3B2F8F` → `#5B4BE0` (trust, focus). Accent: warm amber/gold `#F5A524` (premium, "topper"). Success `#16A34A`, danger `#DC2626`, warning `#D97706`.
> - Neutrals: ink `#0F1222`, slate text `#475467`, muted `#98A2B3`, lines `#EAECF0`, surface `#FFFFFF`, canvas `#F7F8FA`.
> - Typography: **Plus Jakarta Sans** (or Inter) — display/headings bold, body regular. Type scale: 12/14/16/20/24/32/40.
> - Spacing: 8pt grid. Radius: 12px cards, 8px controls, pill for chips. Shadows: soft, low-spread (`0 1px 2px`, `0 8px 24px` for elevated).
> - Motion: subtle (150–200ms ease), respect reduced-motion.
>
> **Reusable component kit (design these once, reuse everywhere):**
> Button (primary/secondary/ghost/danger × sm/md/lg, + loading & disabled), Input/Select/Textarea (with label + error), Search bar, Card, Note card, Badge/Chip (subject, exam, status), Avatar (initials), Star rating, Tabs, Data table (with row actions), Modal/Dialog, Toast, Empty state, Skeleton loader, Pagination, File dropzone, Stat card, Sidebar nav + Topbar.
>
> **Rules:** mobile-first, fully responsive (320 → 1440), WCAG AA contrast, visible focus states, generous whitespace, clear hierarchy. Every interactive element needs hover/focus/active/disabled/loading. Output a cohesive system, then the requested screen.

---

## Prompt 1 — Login

> Design the **Login** page for TopNotes. Split layout: left = brand panel (logo, one-line value prop "Notes from real toppers, verified.", subtle illustration/gradient, 3 trust stats); right = login card. Card: email + password fields, "Forgot password?" link, primary **Log in** button (loading state), divider, "New here? **Create account**" link. Inline error for bad credentials. Centered single-column on mobile (brand panel collapses to a slim header). States: default, loading, error.

## Prompt 2 — Register

> Design the **Register** page (same split shell as Login). First step: **role choice** — two large selectable cards: "I'm a Student (Buyer)" vs "I'm a Topper (Seller)" with icons + one-line descriptions. Then form: full name, email, password (with strength hint), confirm. Primary **Create account**. Note for sellers: "Sellers complete a quick verification after signup." Show validation inline. Responsive single column on mobile.

## Prompt 3 — App shell (Topbar + Sidebar/Nav)

> Design the **app shell**. Topbar: logo left; center search (on buyer pages); right = notifications bell (with unread dot), avatar menu (profile, role, logout). Role-aware nav:
> - Buyer: Browse · My Purchases
> - Seller: Dashboard · Upload · My Notes · Earnings
> - Admin: Dashboard · Users · Verifications · Test Manager · Config
> Desktop = left sidebar (collapsible, icon+label, active highlight). Mobile = bottom tab bar or hamburger drawer. Show the avatar dropdown and the notifications panel as separate states.

## Prompt 4 — Browse (marketplace)

> Design the **Browse** page — the marketplace heart. Top: hero search bar + filter row (Class, Subject, Exam type, Price, Sort) as chips/dropdowns. Body: responsive grid of **Note cards** (thumbnail, title, subject + exam badges, seller avatar+name, star rating + review count, page count, price, "View" CTA). Include: sticky filter sidebar on desktop (collapses to a filter sheet on mobile), result count, pagination/infinite scroll. States: results grid, loading (skeleton cards), empty ("No notes match your filters").

## Prompt 5 — Note Detail

> Design the **Note Detail** page. Two columns (stacks on mobile): left = large preview (first-page thumbnail with a "Preview only" lock overlay), title, subject/exam/class badges, description, page count; seller mini-profile card (avatar, name, institution, AIR/score, bio snippet, "View profile"). Right = sticky **purchase card**: price, "Buy for ₹X" primary button, secure-access note ("View-only · watermarked"), what's included list. Below: **Reviews** section (rating summary + list with avatar, stars, comment, date) and a "write review" box (only if purchased). States: not-purchased (Buy), purchased (Read Notes), loading.

## Prompt 6 — Secure Note Viewer

> Design the **secure PDF viewer** (full-screen, distraction-free). Minimal top bar: note title, page X/Y, close. Center: paged document canvas with a **diagonal per-user watermark** (email, low opacity, repeating). No download/print/sidebar controls. Subtle page navigation (prev/next, page thumbnails optional). A small "protected content" lock indicator. Dark, focused background. Mobile: full-width pages, swipe navigation.

## Prompt 7 — My Purchases (Buyer)

> Design the **My Purchases** page. List/grid of purchased notes: thumbnail, title, seller, purchase date, amount, invoice number, **Read** button + "Download invoice" link. Filter/search by subject. Empty state ("You haven't bought any notes yet → Browse"). Each row also shows a "Write a review" prompt if not yet reviewed. Responsive: table on desktop, stacked cards on mobile.

## Prompt 8 — Seller Dashboard

> Design the **Seller Dashboard**. Top: greeting + 4 **stat cards** (Total Earnings, This Month, Notes Sold, Avg Rating). Main: a **revenue line/area chart** (last 30 days) + a "Recent sales" list (buyer, note, amount, date). Side: quick actions (Upload new note, View payouts), verification status badge. Empty state for new sellers (no sales yet → "Upload your first note"). Responsive: cards wrap, chart full-width on mobile.

## Prompt 9 — Upload Note (Seller)

> Design the **Upload Note** form (multi-section, single page). Sections: (1) Details — title, description, class, subject, exam type, price; (2) Files — PDF dropzone (drag/drop, progress, validation: PDF only, max 50MB) + optional thumbnail image; (3) Review & Publish — summary + "Publish" button. Show inline validation, upload progress, and a live **note-card preview** of how it'll look in Browse. Responsive single column on mobile.

## Prompt 10 — My Notes (Seller)

> Design the **My Notes** management page. Table/grid of the seller's notes: thumbnail, title, status badge (Active/Draft/Deleted), price (inline-editable), sales count, rating, actions (Edit, Edit price, Unpublish/Delete). Top: "Upload new" CTA + filter by status. Empty state. Responsive: cards on mobile with an action menu.

## Prompt 11 — Seller Verification

> Design the **Seller Verification** flow as a 2-step **stepper**. Step 1 — **Academic Test**: intro card (rules: X questions, pass ≥70%, time limit), then the MCQ test UI (one question card at a time or a list, radio options A–D, progress bar, timer, Submit). Result screen: pass (✅ score, proceed) or fail (score + Retake). Step 2 — **Marksheet upload**: image dropzone + "Submit for review", then an "Awaiting admin approval" status card. Show all states: locked, in-progress, passed, pending-approval, approved, rejected (with reason).

## Prompt 12 — Admin Dashboard

> Design the **Admin Dashboard**. Top: 4–5 **stat cards** (Total Users, Sellers, Notes, Revenue, Pending Approvals — the last as a highlighted action button). Main: platform revenue chart + a "Pending seller approvals" preview list and "Recent activity" feed. Clean, data-dense but breathable. Responsive grid.

## Prompt 13 — Admin Users

> Design the **Admin Users** management page. Top: tabs (All / Buyers / Sellers) + search. **Data table**: avatar+name, email, role badge, status badge (Active/Suspended), joined date, row actions (Suspend/Activate, View). Bulk-friendly layout, pagination. Empty/loading states. Mobile = stacked cards with action menu.

## Prompt 14 — Admin Verifications

> Design the **Admin Verifications** queue. List of pending sellers as **review cards**: avatar, name, institution, test score (✓ passed badge), marksheet thumbnail (click to enlarge in modal), submitted date. Actions: **Approve** (green) and **Reject** (with a required reason textarea in a modal). Empty state ("No pending verifications 🎉"). Responsive cards.

## Prompt 15 — Admin Platform Config

> Design the **Platform Config** page. Cards/sections: **Revenue split** (Platform % vs Seller % with a live animated split bar that always sums to 100), **Currency**, **Test pass score %**. Each editable with Save + toast confirmation. Clean settings layout (label + control + helper text rows). Responsive single column.

## Prompt 16 — Admin Test Manager

> Design the **Test Manager** with 3 tabs: (1) **Test Config** — pass score, time limit, questions-per-test, shuffle toggles, Save; (2) **Questions** — list of MCQs with question text, subject tag, active toggle, edit/delete; "+ Add question" opens a modal (question + 4 options A–D + mark correct answer); (3) **Seller Preview** — exactly what sellers see (no correct answers shown). Data-dense but tidy. Responsive: tabs become a dropdown on mobile, questions stack as cards.

---

## Reusability & implementation notes (tie back to the checklist)

Design and build these as **one component library**, not per-page one-offs:

| Reuse this everywhere | Used by |
|---|---|
| **Note card** | Browse, My Purchases, My Notes, Upload preview, dashboards |
| **Stat card** | Seller + Admin dashboards |
| **Data table + row actions** | Admin Users, My Notes, Test Manager |
| **Badge/Chip** (subject/exam/status/role) | almost every page |
| **Modal, Toast, Empty, Skeleton, Pagination, Avatar, Star rating** | global |
| **Stepper** | Seller verification (reusable for any wizard) |

When you implement (Angular):
- Each shared component = standalone, `OnPush`, signal `input()/output()`. Put them in `shared/components` (see [ARCHITECTURE.md](ARCHITECTURE.md)).
- **Caching:** cache list reads (Browse, dashboards) in a service signal / `shareReplay`; invalidate on writes (new purchase, new note, price edit).
- One **ApiService**, one **error interceptor + toast**, typed models — no `any`, no duplicate HTTP. (Full list in [FRONTEND_CHECKLIST.md](FRONTEND_CHECKLIST.md).)
- Build the design-system primitives **first**, then assemble pages from them — that's what makes 16 screens cheap to build and consistent.

> Backend contract is fixed by Akshat's `ApiResponse<T>` + DTOs — design to the data you actually get (see `core/models`). Confirm any new field with him before designing UI that needs it.
