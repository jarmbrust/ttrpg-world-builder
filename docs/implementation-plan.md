# Implementation Plan

Phased build plan for the **multi-tenant** TTRPG World Builder. Each phase ends in a verifiable,
deployable state. Effort is a rough guide for one experienced developer.

---

## Phase 0 — Scaffold & docs ✅

- [x] `create-next-app` (Next 16.4.4, TS, Tailwind 4, App Router, `src/`, pnpm)
- [x] Pin Node `26.x` (`engines.node` + `.nvmrc`) and `packageManager: pnpm@12.16.1`
- [x] Bump `@types/node` to `^26`; TypeScript `^5` → `^6`
- [x] Lean ESLint 10 config (`@eslint/js`, `typescript-eslint`, `@next/eslint-plugin-next`,
      `@eslint-react`); dropped the EOL/stale plugins
- [x] Rename project to `ttrpg-world-builder`; new GitHub repo; docs rewritten for multi-tenancy

## Phase 1 — Deploy + database *(≈ half day)*

- [x] New **public** GitHub repo `ttrpg-world-builder`; local remote linked
- [ ] Confirm `.gitignore` excludes `.env*`, `node_modules`, `.next`, and local content
- [ ] Create a **Neon** project + branch; capture `DATABASE_URL`
- [ ] Create a **Vercel** project (import repo); configure env vars (see Architecture §7)
- [ ] Configure custom domain `ttrpgworldbuilder.com`
- [ ] Add `robots.txt` disallowing AI crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`)
      on everything except the public landing/directory (see Architecture §8)
- [ ] **Done:** app deploys on Vercel, database reachable

## Phase 2 — Multi-tenant schema + migrations *(≈ 1 day)*

- [ ] Add Prisma 7 (latest stable) + `@prisma/client`
- [ ] Write schema from [Data Model](data-model.md): `World`, `Membership`, `WorldJoinRequest`,
      world-scoped `Article`/`Tag`/`Image`/`Character`, unified PC/NPC `Character`
- [ ] Run `prisma migrate dev` against a dev Neon branch
- [ ] Add a `src/lib/db.ts` singleton client
- [ ] **Done:** `prisma studio` shows tables; migrations tracked

## Phase 3 — Auth + platform roles + memberships *(≈ 2–3 days)*

- [ ] Install Better Auth + Prisma adapter; generate auth tables; migrate
- [ ] Configure `emailAndPassword`; add `platformRole` + `canCreateWorlds` to `user`
- [ ] Wire `api/auth/[...all]/route.ts`
- [ ] Build the DAL: `verifySession()`, `requireMembership(worldId)`, `authorize(worldId, action)`
      using `unauthorized()` / `forbidden()`
- [ ] Login + signup pages (closed beta: admin-approval gate)
- [ ] Admin onboarding: grant `canCreateWorlds`, create accounts (temp password), first-login change
- [ ] Login rate limiting / brute-force protection
- [ ] **Done:** users can log in; per-world memberships resolve; unauthorized access blocked

## Phase 4 — World creation + GM authoring *(≈ 2–3 days)*

- [ ] World creation (up to 3 per GM) with slug, name, tagline, quota
- [ ] Article list/create/edit UI under `/w/[slug]/admin` (Markdown editor → DB)
- [ ] Markdown renderer: `react-markdown` + GFM + cross-link resolver (scoped to the world)
- [ ] Reveal workflow: change `tier`, set `revealedAt`; invalidate `world:<id>` tags
- [ ] Tags + related-article cross-links editing
- [ ] Server Actions for all mutations, re-checking `authorize(worldId, …)`
- [ ] Gated pages render dynamically (`dynamic = 'force-dynamic'`) with `Cache-Control: private`
- [ ] **Done:** a GM can create a world, author, link, and reveal articles

## Phase 5 — Player-facing world site *(≈ 3 days)*

- [ ] `w/[worldSlug]` shell + navigation (sections from Data Model §2)
- [ ] Section index pages and `/w/[slug]/wiki/[slug]` article page
- [ ] Recaps feed (`/recaps`, newest first) with cross-links
- [ ] Characters: PCs + NPCs, filterable by `kind`; players edit their own PCs
- [ ] `CharacterUpdate` log entries; optional portraits
- [ ] Static map page (`/maps`)
- [ ] `noindex` on gated pages; nothing sensitive in public metadata / OG / `sitemap.xml`
- [ ] **Done:** players browse their world, read, and maintain their own PCs

## Phase 6 — Directory, request-access & GM dashboard *(≈ 2 days)*

- [ ] Landing page + public world directory (taglines)
- [ ] World home for anonymous visitors: tagline + "request access"
- [ ] `WorldJoinRequest` flow (requires an account); GM approves → creates `Membership`
- [ ] GM dashboard: members, pending requests, world settings
- [ ] **Done:** a visitor can find a world, request access, and be approved

## Phase 7 — Images (Cloudinary) *(≈ 1 day)*

- [ ] Cloudinary signed-upload endpoint + admin upload UI
- [ ] Store `Image.publicId` + `worldId` + `tier`
- [ ] Authenticated delivery route `GET /api/images/[id]` (membership + tier → signed URL)
- [ ] Article covers, character portraits, map art
- [ ] **Done:** art is hidden until revealed, served only to authorized world members

## Phase 8 — Quotas, platform admin & export *(≈ 1–2 days)*

- [ ] Enforce GM world cap (≤ 3) and per-world `quotaBytes` (sum `octet_length(body)` on write)
- [ ] Platform admin UI: GMs, worlds, quotas, approvals
- [ ] World export: download articles as a zip of Markdown files (backup / offline)
- [ ] **Done:** admin can manage the platform; GMs can export their worlds

## Phase 9 — Polish & hardening *(≈ 1–2 days)*

- [ ] Visual polish / theming; landing copy
- [ ] Accessibility pass
- [ ] Security hardening: `robots.txt` + `X-Robots-Tag`, dynamic/private caching audit,
      multi-tenant isolation tests (no cross-world reads)
- [ ] Optional later: full-text search (Postgres FTS), clickable map pins, email notifications

---

## Dependencies

```
Phase 1 → 2 → 3 → 4 → 5 → 6
                       ↘ 7 (after 4)
                           8 → 9
```

## Risks / watch-outs

- **Multi-tenant isolation** is the biggest risk — every query must filter by `worldId`. Centralize
  it in the DAL and test cross-world access explicitly.
- **Better Auth + Prisma adapter** version alignment — follow Better Auth's current docs at
  implementation time (it moved fast after the Vercel acquisition).
- **`unauthorized()` is experimental** (`experimental.authInterrupts`) — fall back to
  `redirect('/login')` / manual 401 if needed.
- **Do not** adopt Prisma 8 RC or TypeScript 7 until tooling supports them (`typescript-eslint`'s
  peer range is `typescript <6.1.0`). ESLint 10 is in use via the lean config; if you later want
  import or accessibility rules, add `eslint-plugin-import-x` or a maintained a11y plugin.
