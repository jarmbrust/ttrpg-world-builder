# Architecture

## 1. Overview

**TTRPG World Builder** is a **multi-tenant** Next.js application: one deployment hosts many
independent campaign **worlds**, each owned by a GM and shared with that GM's players.

- **Tenancy:** a `World` is the tenant. Every article, character, image, and tag belongs to exactly
  one world, and every query is scoped by `worldId`.
- **Authoring:** a GM writes content as Markdown in a private, in-browser editor; content is stored
  in Postgres — **never** in this (public) git repository.
- **Reading:** players browse cross-linked articles, a session-recap feed, characters, and a static
  map, filtered to their memberships.
- **Revealing:** lore starts hidden (GM-only) and is "revealed" to players as the campaign progresses.
- **Joining:** a world exposes a public one-line tagline; to read it, a visitor requests access and
  the GM approves them.

## 2. Stack and pinned versions

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Runtime | Node.js | **26.x** (26.13.0 LTS "Lithium") | Pinned via `engines.node` + `.nvmrc` |
| Package manager | pnpm | **12.x** (12.16.1) | `packageManager` field |
| Framework | Next.js | **16.4.4** | App Router, Turbopack |
| UI library | React | **19.3.0** | |
| Language | TypeScript | **6.x** (6.0.3) | See note below |
| Styling | Tailwind CSS | **4.3.x** | |
| Linting | ESLint | **10.x** (10.14.0) | Lean flat config; see note below |
| Auth | Better Auth | **v1.x (latest)** | email/password plugin, Prisma adapter |
| ORM | Prisma | **7.x (latest stable)** | v8 is RC — do not adopt yet |
| Database | PostgreSQL | **Neon** (serverless) | |
| Markdown | react-markdown (+ remark-GFM) | latest | rendered from DB `body` |
| Images | Cloudinary | latest SDK | signed/private delivery |
| Hosting | Vercel | — | |

### Version notes (important)

- **TypeScript:** **6.x is the correct current version** — 6.0 is the final JS-based release. The
  scaffolder emits `^5` (stale); we bumped to 6.x and verified a clean `pnpm build`. The newest
  *release* is 7.0 (the native Go compiler), but it exposes **no stable JS compiler API**, so
  `typescript-eslint` (peer range `typescript >=4.8.4 <6.1.0`) does not support it, and Next.js
  needs an opt-in `useTypeScriptCli` flag — effectively experimental. Do not bump to 7 until
  `typescript-eslint` supports it.
- **ESLint:** on **10.x**. We deliberately **dropped `eslint-config-next`** (which dragged in EOL/
  stale plugins: `eslint-plugin-react` is EOL, `jsx-a11y` last shipped Oct 2024, `import` last
  shipped Jun 2025 — all capped at ESLint 9) in favour of a lean flat config: `@eslint/js` +
  `typescript-eslint` + `@next/eslint-plugin-next` + `@eslint-react/eslint-plugin`. Import rules are
  omitted (TypeScript already catches bad imports) and accessibility rules are deferred.
- **`@types/node`:** bumped to `^26` to match the Node runtime.
- **Prisma:** v8 is a rewrite and still RC. Pin to the latest stable **7.x**.

## 3. Key decisions

### D1 — Public repo, content in the database

The GitHub repository is **public** (code + docs only). All world content, GM notes, and art
references live in **Postgres**, entered through the GM editor. Nothing sensitive is committed to
git.

### D2 — Better Auth instead of NextAuth

NextAuth.js/Auth.js was **deprecated** in 2025 and folded into **Better Auth** (which Vercel
acquired in July 2026). We use its `emailAndPassword` plugin with the Prisma adapter and add a
custom `platformRole` field to its `user` table.

### D3 — Multi-tenant model (World + Membership)

A `World` is the tenant and the unit of ownership. A `Membership` links a `User` to a `World` with
a role (`GM` or `PLAYER`). Platform-wide authority is a separate `platformRole` (`USER` | `ADMIN`).
For v1:

- **One GM per world**, recorded as `World.ownerId` (the "primary" GM if co-GMs ever arrive).
- A user may be **GM of up to 3 worlds**; **player memberships are unlimited**.
- A GM is not also a player in their own world (v1).

The `Membership` join-table replaces "flags on the user": it cleanly expresses "GM of world X,
player in world Y, player in world Z."

### D4 — Closed beta + request access

GMs are onboarded by the platform admin (an admin-granted `canCreateWorlds` flag). Players join a
world by sending an **in-app access request** (`WorldJoinRequest`, requires an account); the GM
approves or declines. No public self-service GM signup, no email service in v1.

### D5 — Reveal workflow

Every article/image has a visibility `tier` (`public | player | gm`). "Revealing" content is moving
it `gm → player` (a `revealedAt` timestamp is recorded), per world.

### D6 — Markdown in DB, rendered with react-markdown

Bodies are stored as Markdown and rendered server-side with `react-markdown` + GFM. A custom link
resolver turns `[[Slug]]` / `[text](wiki:slug)` into cross-links scoped to the same world.

### D7 — Cloudinary for protected images

Art that should stay hidden until revealed is stored in Cloudinary and served through an
authenticated route that returns a short-lived signed URL (or streams bytes) after checking the
viewer's tier.

### D8 — Vercel + Neon

Vercel hosts the app; Neon hosts serverless Postgres. Both read `engines.node` for the runtime.

### D9 — Lean ESLint 10 config (no `eslint-config-next`)

`@eslint/js` (core rules) + `typescript-eslint` + `@next/eslint-plugin-next` (`core-web-vitals`) +
`@eslint-react/eslint-plugin` (React + hooks). Import rules omitted; accessibility deferred.
Verified: `pnpm lint` passes and TSX files are linted.

### D10 — Quotas and export

- **World cap:** a GM may own ≤ 3 worlds (constant, easy to change).
- **Storage cap:** a per-world `quotaBytes` (default 20 MB of text), enforced on write via
  `sum(octet_length(body))` over the world's articles.
- **Export:** a GM can download their world's articles as a zip of Markdown files (backup / offline).

## 4. Access-control model

### Platform roles

| Role | Meaning |
|---|---|
| `ADMIN` | The platform owner. Manages GMs/worlds, quotas, and membership approvals; can view any world. |
| `USER` | A normal account. Authority comes from per-world memberships. |

`User.canCreateWorlds` (admin-granted) lets an approved user create up to 3 worlds.

### World roles (via `Membership`)

| Role | Meaning |
|---|---|
| `GM` | The world owner (`World.ownerId`): author, reveal, invite/approve members, manage the world. |
| `PLAYER` | Reads public + player-tier content in that world; manages their own PCs. |
| *(readOnly)* | Either role can be marked `readOnly` for view-only access. |

### Permission matrix (scoped to one world)

| Capability | anon | Player | GM (owner) | Platform admin |
|---|---|---|---|---|
| See world directory + taglines | ✅ | ✅ | ✅ | ✅ |
| Read `public` articles | ✅ | ✅ | ✅ | ✅ |
| Read `player` articles | — | ✅ | ✅ | ✅ |
| Read `gm` articles | — | — | ✅ | ✅ |
| Edit own PCs | — | ✅ | — | ✅ |
| Create / edit NPCs | — | — | ✅ | ✅ |
| Create / edit / delete articles | — | — | ✅ | ✅ |
| Reveal content (tier change) | — | — | ✅ | ✅ |
| Manage members / access requests | — | — | ✅ | ✅ |
| Create a world | — | — | — | ✅ (via admin grant) |
| View platform admin | — | — | — | ✅ |

### Enforcement

Authorization is enforced **in the Data Access Layer** (DAL), not only at the edge:

1. `verifySession()` reads the Better Auth session and returns the user + `platformRole` +
   `canCreateWorlds`.
2. `requireMembership(worldId)` resolves the viewer's role/`readOnly` in that world.
3. A single `authorize(worldId, action)` helper checks **platform role + world membership +
   `readOnly`** and throws `unauthorized()` (401) or `forbidden()` (403).
4. It runs **before any query** in server components and is **re-checked in every Server Action**.
   `readOnly: true` blocks every mutation.
5. Every Prisma query is **scoped by `worldId`** — the cardinal multi-tenant rule.

## 5. Routing

All content is world-scoped by slug: `ttrpgworldbuilder.com/w/[worldSlug]/…`.

- `/` — landing + public world directory (taglines) + login.
- `/w/[slug]` — world home (anonymous: tagline + "request access"; member: full navigation).
- `/w/[slug]/wiki/[article]` — an article.
- `/w/[slug]/<world|locations|factions|pantheon|history|house-rules|recaps|characters|maps>` —
  section indexes.
- `/w/[slug]/characters/[id]` — a character (PC editable by its owner; NPCs GM-managed).
- `/w/[slug]/admin` — GM dashboard (content, reveal, members, requests, export).
- `/admin` — platform admin (GMs, worlds, quotas).

## 6. Next.js 16 conventions (do not write stale patterns)

- **`middleware.ts` is deprecated** → use **`proxy.ts`** (export `proxy`) for coarse redirects only.
- **`unauthorized()` / `forbidden()`** (experimental; enable `experimental.authInterrupts`) render
  `unauthorized.tsx` / `forbidden.tsx`. Use them in the DAL.
- **`params`/`searchParams` are Promises** in page props (`await params`).
- **Mutations** use **Server Actions** (`'use server'`), re-checking auth.
- **Caching** uses **Cache Components** (`'use cache'`, `cacheLife`, `cacheTag`). Tag pages by world
  so reveals invalidate correctly.
- **Route handlers** live in `route.ts`.
- Lint is plain `eslint` (not `next lint`) with the lean flat config (D9).

## 7. Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | Better Auth session signing secret |
| `BETTER_AUTH_URL` | Canonical app URL (`https://ttrpgworldbuilder.com`) |
| `AUTH_TRUST_HOST` | `true` on Vercel |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Cloudinary credentials |
| `NEXT_PUBLIC_APP_URL` | Public base URL (for links/meta) |

## 8. Content security (bots & scrapers)

Content is stored as Markdown in **Postgres** (Neon), which is private and not directly reachable
by crawlers. Security is therefore about **what the app serves**.

- **Auth-gated content is invisible to anonymous bots** — crawlers can't authenticate, so
  `player`- and `gm`-tier pages return a login redirect or `401`, never the Markdown.
- **The one real risk is accidental public caching.** Next 16 enables Cache Components / static
  prerendering. Rules:
  1. `authorize()` runs **before** any data fetch; `unauthorized()` / `forbidden()` interrupt render
     (and inject `noindex`).
  2. Gated routes render **dynamically** (`dynamic = 'force-dynamic'`, or rely on `cookies()` /
     `unauthorized()`); no static prerender.
  3. Authenticated responses send `Cache-Control: private, no-store`; never use a public `cacheTag`
     or `use cache` for user-specific data.
- **Public content is scrapable by design** — the landing, world directory, and taglines. `robots.txt`
  disallows and `noindex` / `noai` meta are **advisory**. Keep the public surface minimal and put
  nothing sensitive in public metadata / OG / `sitemap.xml`.
- **Auth cannot stop an authorized reader from copying** — a player or a GM can copy text by hand.
  Optional per-account **watermarking** helps attribution, not prevention.

## 9. Open assumptions (confirm before/at implementation)

1. **One GM per world** in v1; co-GMs (and "hide content from other GMs") are deferred.
2. **NPCs are characters** (`Character.kind = NPC`), not a separate article type; the "NPCs" and
   "Characters" nav sections merge into **Characters** with a PC/NPC filter.
3. **No full-text search** initially; cross-links + recaps feed only.
4. **Static image map** first; clickable pins later.
5. **No email service** initially; joins are in-app requests, accounts are admin/GM-created.
6. **Display name:** docs use "TTRPG World Builder" (from the `ttrpg-world-builder` slug).
