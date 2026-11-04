# Implementation Plan

Phased build plan. Each phase ends in a verifiable, deployable state. Effort is a rough guide for
one experienced developer.

---

## Phase 0 — Scaffold & docs ✅

- [x] `create-next-app` (Next 16.4.4, TS, Tailwind 4, App Router, `src/`, pnpm)
- [x] Pin Node `26.x` (`engines.node` + `.nvmrc`) and `packageManager: pnpm@12.16.1`
- [x] Bump `@types/node` to `^26`
- [x] Bump TypeScript `^5` → `^6` (TS 6 = current JS-based release; TS 7 is native/experimental)
- [x] Replace `eslint-config-next` with a lean ESLint 10 config (`@eslint/js`, `typescript-eslint`,
      `@next/eslint-plugin-next`, `@eslint-react`); dropped the EOL/stale plugins
- [x] Write planning/architecture docs (this folder)

## Phase 1 — Repo, deploy, database *(≈ half day)*

- [ ] `git init`; create **public** GitHub repo `world-of-varun`; initial commit
- [ ] Confirm `.gitignore` excludes `.env*`, `node_modules`, `.next`, and any local content dumps
- [ ] Create a **Neon** project + branch; capture `DATABASE_URL`
- [ ] Create a **Vercel** project (import repo); configure env vars (see Architecture §6)
- [ ] Configure custom domain `worldofvarun.com`
- [ ] Add `robots.txt` disallowing AI crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`)
      on everything except the public landing page (see Architecture §8)
- [ ] **Done:** empty app deploys on Vercel, database reachable

## Phase 2 — Prisma schema + migrations *(≈ half day)*

- [ ] Add Prisma 7 (latest stable) + `@prisma/client`
- [ ] Write schema from [Data Model](data-model.md) (Better Auth tables + domain tables)
- [ ] Run `prisma migrate dev` against a local/dev Neon branch
- [ ] Add a `src/lib/db.ts` singleton client
- [ ] **Done:** `prisma studio` shows tables; migrations tracked

## Phase 3 — Authentication (Better Auth) *(≈ 1–2 days)*

- [ ] Install Better Auth + Prisma adapter; generate auth tables into schema; migrate
- [ ] Configure `emailAndPassword` plugin; add custom `role` and `readOnly` fields to `user`
- [ ] Wire `api/auth/[...all]/route.ts` handler
- [ ] Build `src/lib/dal.ts`: `verifySession()` and `authorize()` (checks `role` + `readOnly`)
      using `unauthorized()` / `forbidden()`
- [ ] Login page (`/login`) + sign-out
- [ ] Invite-only user creation: GM creates account (email + temp password) in an admin action;
      first-login password change
- [ ] Login rate limiting / brute-force protection
- [ ] Route-group protection: `(site)`/`(gm)` gate via DAL; optional `proxy.ts` redirect to `/login`
- [ ] **Done:** GM (admin), Player, and read-only (guest) accounts can log in; unauthorized access is blocked

## Phase 4 — Content & GM admin editor *(≈ 2–3 days)*

- [ ] Article list/create/edit UI under `/admin` (Markdown editor → DB)
- [ ] Markdown renderer: `react-markdown` + GFM + cross-link resolver (`[[Slug]]` / `wiki:slug`)
- [ ] Reveal workflow UI: change `tier`, set `revealedAt`
- [ ] Tags + related-article cross-links editing
- [ ] Server Actions for all mutations, re-checking `authorize()` (role `GM`, `readOnly: false`)
- [ ] Gated pages render dynamically (`dynamic = 'force-dynamic'`) with `Cache-Control: private` —
      no static prerender of protected content (see Architecture §8)
- [ ] **Done:** GM can author, link, and reveal articles from the browser

## Phase 5 — Player-facing site *(≈ 2–3 days)*

- [ ] `(site)` shell + navigation (all sections from Data Model §2)
- [ ] Section index pages (filtered by `type`) and `/wiki/[slug]` article page
- [ ] Recaps feed (`/recaps`, newest first) with cross-links
- [ ] Static map page (`/maps`)
- [ ] Character pages: GM-authored intro + player **self-edit** form
      (name, class, ancestry, background) and `CharacterUpdate` status entries
- [ ] Cache invalidation via `revalidateTag` on reveal/edit
- [ ] `noindex` on gated pages; nothing sensitive in public metadata / OG / `sitemap.xml`
- [ ] **Done:** players browse, read, and maintain their own character

## Phase 6 — Images (Cloudinary) *(≈ 1 day)*

- [ ] Cloudinary signed-upload endpoint + admin upload UI
- [ ] Store `Image.publicId` + `tier`
- [ ] Authenticated delivery route `GET /api/images/[id]` (tier check → short-lived signed URL)
- [ ] Cover images on articles, portraits on characters, map art
- [ ] **Done:** art is hidden until revealed, served only to authorized viewers

## Phase 7 — Seed content & polish *(≈ ongoing)*

- [ ] Seed initial world content **via the admin editor** (not committed to git)
- [ ] Landing-page copy + visual polish (Tailwind theming)
- [ ] Accessibility pass; meta/`noindex` on gated pages
- [ ] Optional later: full-text search (Postgres FTS), clickable map pins, email invites

---

## Dependencies

```
Phase 1 → 2 → 3 → 4 → 5
                   ↘ 6 (can start after 4)
                       7 (after 4/5)
```

## Risks / watch-outs

- **Better Auth + Prisma adapter** version alignment — follow Better Auth's current docs at
  implementation time (it moved fast after the Vercel acquisition).
- **`unauthorized()` is experimental** (`experimental.authInterrupts`) — if it causes issues,
  fall back to plain `redirect('/login')` / manual 401 in the DAL.
- **Do not** adopt Prisma 8 RC or TypeScript 7 until tooling supports them (`typescript-eslint`'s
  peer range is `typescript <6.1.0`). ESLint 10 is already in use via the lean config; if you later
  want import or accessibility rules, add `eslint-plugin-import-x` or a maintained a11y plugin — not
  the old `eslint-plugin-import` / `jsx-a11y`.
