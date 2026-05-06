# CLAUDE.md

Project-level notes for any contributor (human or AI agent) working in this repo.

## What this is
**YSC POS** — point-of-sale frontend for Yongcharoen stationery. React 18 + Vite 6 + TypeScript + Tailwind 4 + Radix UI.

## Quick start
```
npm install
npm run dev          # Vite on http://localhost:5174
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

## Backend integration

The repo is mid-migration from mock data to a real backend.

- **Backend repo:** `ysc-core-api` (NestJS + Prisma + Postgres + better-auth, deployed on DigitalOcean)
- **API base** is configured in `.env.development` (`VITE_API_URL`)
- **Service layer** lives in `src/services/` (`apiClient`, `authApi`, `cartApi`, `customersApi`, `ordersApi`, `productsApi`, `configApi`). New code should call these — not `src/services/mockApi.ts` or `src/data/`.
- **Auth:** cookie-based (better-auth). `apiClient` sends `credentials: 'include'`; on 401 it redirects to `/login` (skipped for `/auth/*` and `/me*` so the login screen doesn't loop).
- **POS users need role `pos_staff`** with permission `pos.scan` to use cart endpoints. Admin promotes via `PATCH /admin/users/:id/role`.

## API contract — single source of truth

**`doc/pos-api-spec.md` is the SSOT for the POS↔backend contract.** Treat it as authoritative. When the spec changes:

1. Diff the spec.
2. Update matching `src/services/*.ts` — endpoint paths, request/response shapes, error handling.
3. Commit spec + code together as one focused commit.

Past drift example: spec said `GET /me`, real backend exposes `GET /me/permissions`. Always defer to the spec when in doubt; if the spec is wrong, ping the backend team and fix the doc first.

## Endpoint gotchas (current)

- `GET /me` does **not** exist — use `GET /me/permissions` (returns user + `permissions: string[]`).
- POS endpoints (`/pos/cart/*`) require `pos.scan` permission. Missing permission currently surfaces as HTTP 500 (backend bug — should be 403).
- `GET /pos/cart/active` intermittently returns 500 with stale or invalid session cookies. **Open issue with backend team as of 2026-05-06** — don't paper over it in the frontend.

## Conventions

- **No new files at the root or in `src/data/` for new features** — wire to `src/services/` instead.
- **Commit style:** lowercase prefix (`feat:`, `fix:`, `docs:`, `chore:`), imperative mood, no trailing period. Recent history shows the pattern.
- **TypeScript strict is on.** Don't add `any` to silence — fix the types or narrow with a type guard.
- **Tailwind first.** Avoid inline `style={{}}` except for brand colors that aren't in the Tailwind palette (navy `#14264E`, yellow `#EFB419`, primary action sky `#0EA5E9`).

## Open work

- Old mock files (`src/data/`, `src/app/api/mock/`) are still imported in places — full cutover to real API is in progress.
- Pre-existing TS errors in `src/data/orders.ts`, `src/app/api/mock/products.ts`, etc. — known, not blocking, will be cleaned up alongside the cutover.
- Auth guard on routes (`/` should require login) — not yet implemented; relying on apiClient's 401 redirect today.

## Windows / PowerShell notes

- PowerShell ExecutionPolicy blocks `npm.ps1`. If `npm` fails with "running scripts is disabled", call `& "C:\Program Files\nodejs\npm.cmd"` directly, or run from cmd.exe / WSL.
- After fresh Node install via winget, refresh PATH in the current session before npm is callable.
