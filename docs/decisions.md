# Decisions

One line each: where the brief left a choice open, what was picked and why.

| # | Decision | Rationale |
|---|---|---|
| 1 | Tailwind CSS v4 with `@theme inline` mapping to CSS-variable tokens | Tokens stay the single source of truth; no tailwind.config file. |
| 2 | Hosting: Firebase Hosting, CI on GitHub Actions | Same project as Auth/Firestore/Functions; SPA rewrites + cache headers in `firebase.json`. |
| 3 | Accent colour: amber `#FFB020`, used only as a fill with navy text | Complement of navy; AA-safe with navy text; distinct from info/link blue. |
| 4 | Fonts self-hosted via `@fontsource` packages (Barlow Condensed 700/800 italic, Inter Variable) | Offline-safe, no third-party requests, precached by the service worker. |
| 5 | TanStack Query not installed | Firestore listeners + Zustand cover data needs; add only if a non-Firestore fetch appears. |
| 6 | Account provisioning: existing profile → email invite (`invites/{email}`) → first user bootstraps org as admin → otherwise "no access" | Closed system without needing Cloud Functions in Phase 1; owner is whoever signs in first, so the admin must sign in first after deploy. |
| 7 | Sync chip "queued writes" = Firestore write promises not yet acknowledged this session; writes restored from a previous session show "Syncing" via `waitForPendingWrites` | Firestore exposes no queue length; promise resolution is server-ack, so this is exact for the session. |
| 8 | PWA `registerType: 'prompt'` | Never swap the app out from under a coach mid-session; the update toast lets them choose when. |
| 9 | Theme/motion preferences stored in localStorage (per device) | Per-viewer convenience; applied before first paint by an inline script to avoid flash. |
| 10 | Progress ring animates SVG `pathLength` | Tiny SVG; the only non-transform/opacity animation, deliberately limited to small rings. |
| 11 | Command palette deferred to Phase 4 | Needs athlete/exercise data to be meaningful. |
