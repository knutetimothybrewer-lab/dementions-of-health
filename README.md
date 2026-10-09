# Top Tier Strength & Conditioning Tracker

Installable, offline-capable web app for strength and conditioning coaches at Top Tier Physical Therapy.
Not an EHR — see [docs/privacy.md](docs/privacy.md) (added in Phase 3).

## Quick start (local, no Firebase project needed)
```bash
npm ci
cp .env.example .env.local       # VITE_USE_EMULATORS=true by default
npm run emulators                # needs Java 11+ and: npm i -g firebase-tools
npm run dev                      # http://localhost:5173
```
The first account to sign in against an empty org becomes its admin.

## Scripts
`npm run dev | build | preview | lint | typecheck | test | emulators | palette`

## Manual setup (complete guide is finished in Phase 12)
1. Create a Firebase project; add a Web app; copy its config into `.env.local` (see `.env.example`).
2. Authentication → Sign-in method → enable **Email link (passwordless)** and **Google**; add your hosting domain under Authorized domains.
3. Create a Firestore database (production mode) and deploy rules: `firebase deploy --only firestore`.
4. Drop your logo at `assets/logo.png` (optional; a placeholder wordmark is used otherwise).

See [CLAUDE.md](CLAUDE.md) for architecture and conventions and [docs/decisions.md](docs/decisions.md) for design decisions.
