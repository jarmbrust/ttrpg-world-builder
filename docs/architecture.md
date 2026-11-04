# Architecture

## 1. Overview

**World of Varun** is a Next.js application that serves a read-mostly campaign wiki with two base
roles — **Player** and **GM** — plus a read-only **guest mode** (admin-toggled) used for demos and
interviews.

- **Authoring:** the GM writes content as Markdown in a private, in-browser editor; content is
  stored in Postgres — **never** in the (public) git repository.
- **Reading:** players browse cross-linked articles, a session-recap feed, and a static map.
- **Revealing:** lore starts hidden (GM-only) and is "revealed" to players as the campaign
  progresses.

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
  `typescript-eslint` + `@next/eslint-plugin-next` + `@eslint-react/eslint-plugin`. This keeps us on
  current, maintained tooling. Import rules are intentionally omitted (TypeScript already catches
  bad imports) and accessibility rules are deferred (no maintained ESLint-10 successor yet).
- **`@types/node`:** the scaffold defaulted to `^20`; this has been bumped to `^26` to match the
  Node runtime.
- **Prisma:** v8 is a rewrite and still RC. Pin to the latest stable **7.x**.

## 3. Key decisions

### D1 — Public repo, content in the database

The GitHub repository is **public** (code + docs only). All lore content, GM notes, and art
references live in **Postgres**, entered through the GM admin editor. Nothing sensitive is ever
committed to git. (This was the resolution to "author in Markdown, but don't publish it.")

### D2 — Better Auth instead of NextAuth

NextAuth.js/Auth.js was **deprecated** in 2025 and folded into **Better Auth** (which Vercel
acquired in July 2026). For an email/password app on Vercel, Better Auth is the current,
actively-maintained choice. We use its `emailAndPassword` plugin with the Prisma adapter and add a
custom `role` field to its `user` table.

### D3 — Two roles + guest mode (the GM is the admin)

There are two base roles — `PLAYER` and `GM` — and the **GM is the admin** (no separate admin
role). Read-only access is a temporary, admin-toggled **`readOnly` flag** on the account (guest
mode), not a role. Combining role × readOnly yields four account types: GM (admin), Player,
Guest-Player, and Guest-GM (see §4).

### D4 — Reveal workflow

Every article/image has a visibility `tier` (`public | player | gm`). "Revealing" content is the
act of moving it `gm → player` (a `revealedAt` timestamp is recorded). This lets the GM prep
lore ahead of time and surface it to players as it becomes known in-game.

### D5 — Markdown in DB, rendered with react-markdown

Bodies are stored as Markdown text and rendered server-side with `react-markdown` + GFM. A custom
link resolver turns `[[Slug]]`-style or `[text](wiki:slug)` links into cross-links between
articles (see data model).

### D6 — Cloudinary for protected images

Non-sensitive art may be committed to the public repo, but anything that should stay hidden until
revealed is stored in Cloudinary and served through an authenticated route that returns a
short-lived signed URL (or streams bytes) after checking the viewer's tier.

### D7 — Vercel + Neon

Vercel hosts the app; Neon hosts serverless Postgres. Both read `engines.node` for the runtime.

### D8 — Lean ESLint 10 config (no `eslint-config-next`)

Rather than `eslint-config-next` (whose plugin dependencies are EOL/stale and block ESLint 10), the
lint setup is a lean flat config: `@eslint/js` (core rules) + `typescript-eslint` +
`@next/eslint-plugin-next` (`core-web-vitals`) + `@eslint-react/eslint-plugin` (React + hooks rules,
the maintained successor to the EOL `eslint-plugin-react`). Import rules are omitted (redundant with
TypeScript); accessibility rules are deferred. Verified: `pnpm lint` passes and TSX files are linted.

## 4. Access-control model

### Roles and account types

Two base roles; the **GM is the admin** (no separate admin role). Read-only access is a temporary
**`readOnly` flag** (guest mode) that the admin toggles on any account.

| Account type | `role` | `readOnly` | Reads | Writes |
|---|---|---|---|---|
| **GM (admin)** | `GM` | `false` | public + player + gm | full (author, reveal, manage users, toggle guest) |
| **Player** | `PLAYER` | `false` | public + player | edit own character |
| **Guest-Player** | `PLAYER` | `true` | public + player | none |
| **Guest-GM** | `GM` | `true` | public + player + gm¹ | none |
| *(anon)* | — | — | public only | none |

¹ Guest-GM sees gm-tier content by default. A future global **`hideGmSecretsFromGuests`** setting
(admin-toggled) would drop Guest-GM's read scope to `player` when enabled.

### Permission matrix

| Capability | anon | Player | Guest-Player | GM (admin) | Guest-GM |
|---|---|---|---|---|---|
| Read `public` content | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read `player` content | — | ✅ | ✅ | ✅ | ✅ |
| Read `gm` content | — | — | — | ✅ | ✅¹ |
| Edit own character page | — | ✅ | — | ✅ (any) | — |
| Create / edit / delete articles | — | — | — | ✅ | — |
| Reveal content (tier change) | — | — | — | ✅ | — |
| Manage users / toggle guest mode | — | — | — | ✅ | — |
| View admin (GM) screen | — | — | — | ✅ | ✅ (view-only) |

¹ As above: `hideGmSecretsFromGuests` (future) would remove this.

### Enforcement

Authorization is enforced **in the Data Access Layer** (DAL), not only at the edge:

1. A `verifySession()` helper reads the session (Better Auth) and returns the user, `role`, and
   `readOnly`.
2. A single `authorize(action)` helper checks **role and `readOnly`** and throws `unauthorized()`
   (401) when not signed in, or `forbidden()` (403) when signed in but lacking permission.
   `readOnly: true` blocks **every** mutation — including reveal and account management.
3. Server Components call `authorize()` before querying; **Server Actions** re-check it before any
   mutation (Next explicitly warns against relying on proxy alone).
4. A thin `proxy.ts` optionally redirects unauthenticated visitors on protected route groups to
   `/login` — a UX convenience, not the security boundary.

## 5. Next.js 16 conventions (do not write stale patterns)

- **`middleware.ts` is deprecated** → use **`proxy.ts`** (export `proxy`). Proxy is for coarse
  routing/redirects, not authoritative auth.
- **`unauthorized()` / `forbidden()`** (experimental; enable `experimental.authInterrupts`) render
  `unauthorized.tsx` / `forbidden.tsx`. Use them in the DAL for auth/authorization.
- **`params`/`searchParams` are Promises** in page props (`await params`).
- **Mutations** use **Server Actions** (`'use server'`) with form actions, re-checking auth.
- **Caching** uses **Cache Components** (`'use cache'`, `cacheLife`, `cacheTag`) rather than the
  old `fetch` cache options. Tag article pages so reveals invalidate the cache.
- **Route handlers** live in `route.ts` (`GET`/`POST`/…).
- Lint is plain `eslint` (not `next lint`, which was removed), using a lean flat config (see D8).

## 6. Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | Better Auth session signing secret |
| `BETTER_AUTH_URL` | Canonical app URL (Vercel) |
| `AUTH_TRUST_HOST` | `true` on Vercel |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Cloudinary credentials |
| `NEXT_PUBLIC_APP_URL` | Public base URL (for links/meta) |

## 7. Open assumptions (confirm before/at implementation)

1. **Guest-GM reads gm-tier content** by default (flagged in §4); a future global
   `hideGmSecretsFromGuests` setting will let the admin hide it.
2. **No full-text search** initially; cross-links + recaps feed only. Can add Postgres FTS later.
3. **Static image map** first; clickable pins later (Leaflet/MapLibre) if wanted.
4. **No email service** initially: the GM creates accounts with a temporary password; players
   change it on first login. (Magic-link / password-reset email can be added later.)

## 8. Content security (bots & scrapers)

Content is stored as Markdown in **Postgres** (Neon), which is private and not directly reachable
by crawlers. Security is therefore about **what the app serves**, not where the content is stored.

- **Auth-gated content is invisible to bots by default.** Anonymous crawlers (`GPTBot`,
  `ClaudeBot`, `Google-Extended`, `CCBot`, generic scrapers, …) cannot authenticate, so
  `player`- and `gm`-tier pages return a login redirect or `401` — never the Markdown.
- **The one real risk is accidental public caching.** Next 16 enables Cache Components / static
  prerendering. If a gated page is prerendered (or edge-cached) before its auth check runs, its
  HTML could become publicly fetchable. Rules:
  1. `authorize()` runs **before** any data fetch in the server component; `unauthorized()` /
     `forbidden()` interrupt the render (and inject `noindex`).
  2. Gated routes render **dynamically** (`export const dynamic = 'force-dynamic'`, or rely on
     `cookies()` / `unauthorized()`); no static prerender.
  3. Authenticated responses send `Cache-Control: private, no-store`; never use a public
     `cacheTag` or `use cache` for user-specific data.
- **Public (`tier: public`) content is scrapable by design** and may be ingested into AI training
  sets. `robots.txt` disallows and `noindex` / `noai` meta are **advisory** — reputable crawlers
  mostly honor them, malicious ones ignore them. Keep the public surface minimal (a hook + login)
  and put nothing sensitive in public metadata / OG tags / `sitemap.xml`.
- **Auth cannot stop an authorized reader from copying.** A player — or anyone holding the shared
  **Guest-GM reviewer account** (which reads `gm`-tier content) — can copy text out by hand. Treat
  that account like a secret (strong password, revoke when done). Optional per-account
  **watermarking** aids leak attribution, not prevention.

Controls (phase placement in the implementation plan): `robots.txt` + `X-Robots-Tag` on gated
routes, `noindex` on gated pages, dynamic rendering + private caching, login rate limiting, and an
optional Vercel WAF / bot-management layer plus a copyright / terms-of-use notice.
