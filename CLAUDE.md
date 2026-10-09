# Top Tier S&C Tracker — project guide

Offline-capable PWA for strength & conditioning coaches (and optional athlete self-service) at Top Tier Physical Therapy.
**Scope is strictly S&C.** No client billing, PT scheduling, or clinical documentation. **Not an EHR: never store PHI** (see `docs/privacy.md`).

## Commands
| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Lint / typecheck / tests | `npm run lint` · `npm run typecheck` · `npm test` |
| Production build | `npm run build` |
| Firebase emulators | `npm run emulators` (Auth 9099, Firestore 8080, UI 4000) — needs Java + `firebase-tools` |
| Sample logo colours | `npm run palette` (reads `assets/logo.png`) |
| Regenerate PWA icons | `node scripts/gen-icons.mjs` |

## Architecture
- Vite + React 19 + TypeScript (strict, `noUncheckedIndexedAccess`), React Router, Zustand for UI/session state. Path alias `@/` → `src/`.
- Firebase: Auth (email link + Google), Firestore with IndexedDB persistence (multi-tab). Everything is keyed by `orgId` (`VITE_ORG_ID`, default `top-tier`).
- `src/lib/firebase.ts` — single init; emulators are used when `VITE_USE_EMULATORS=true` or no project is configured.
- `src/features/auth/` — auth store, sign-in, profile provisioning (existing profile → invite by email → first-user org bootstrap → "no access"), route guards. Roles: `admin | coach | athlete`.
- `src/stores/sync.ts` — **all Firestore writes must be wrapped in `trackWrite()`**; unresolved promises are the "queued writes" count in the sync chip.
- `src/components/ui/` — animation primitives (Stripes, CountUp, ProgressRing, PageTransition, Stagger, Skeleton, Button, SyncChip, Toaster).
- `src/lib/calc/` (Phase 2) — pure calculation engine, no UI imports, 100% branch coverage target.
- Pages are route-level lazy chunks in `src/pages/`.

## Conventions
- Components small and typed; no `any` without a comment; no dead code; no placeholder copy.
- Animation: transform/opacity only; always respect reduced motion via `useReduced()` (`src/lib/useReduced.ts`) and Framer's `MotionConfig` (set in `App.tsx`). Animation must never slow data entry.
- Touch targets ≥ 48px (`min-h-12`). Safe-area insets via `--safe-*` CSS vars.
- Colours only via tokens (`src/styles/tokens.css`, exposed to Tailwind as `bg-surface`, `text-muted`, `bg-primary`, …). `src/styles/tokens.test.ts` asserts WCAG AA for all token pairs in both themes — re-run after touching tokens.
- localStorage access goes through `src/lib/safeStorage.ts` (can throw).
- Units: see `docs/decisions.md` (canonical kg internally — added in Phase 2).
- Decisions the brief left open go in `docs/decisions.md` with a one-line rationale.

## Branding
- Logo swap point: `src/brand/logoSource.ts` — drop `assets/logo.png` and it replaces the SVG placeholder wordmark everywhere.
- Palette: navy `#1F3A63`, silver-sage `#D8DDD6`, white. **Accent = amber `#FFB020`** for PR/success moments only: it's navy's complement, reads on both light and deep-navy surfaces, and is distinct from link/info blue. Always a fill with navy text (amber text fails AA on white).
- Display type: Barlow Condensed 800 italic (self-hosted via @fontsource); body: Inter Variable; big numbers use `.num` (tabular).

## Status
Phase 1 (Foundation) complete. See git log for later phases.
