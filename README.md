# World of Varun

A read-mostly lore wiki for a tabletop RPG campaign (a D&D 5e-like system). The Game Master
(GM) authors and curates the world; players read cross-linked lore, session recaps, and maps,
and maintain their own character page. Built with Next.js 16 + Postgres and deployed on Vercel
at [worldofvarun.com](https://worldofvarun.com).

## What is it

- **Purpose:** give the campaign's players easy access to the setting — regions, factions, NPCs,
  the pantheon and religion, history, house rules, session recaps, characters, and maps.
- **Access:** two roles — **player** and **GM** (the GM is the admin) — plus a temporary read-only
  **guest mode** for each (Guest-Player, Guest-GM), used for demos and interviews.
- **Privacy:** all lore lives in Postgres and is **never** committed to this public repository.
  Content is authored in a private in-browser editor and "revealed" to players as the campaign
  progresses.
- **Status:** early scaffold — see the implementation plan for the phased roadmap.

## Index

- **[Architecture](docs/architecture.md)** — stack, pinned versions, key decisions, and the access model.
- **[Data Model](docs/data-model.md)** — Prisma schema, content types, and the URL map.
- **[Implementation Plan](docs/implementation-plan.md)** — phased build plan with task checklists.
- **[Docs index](docs/README.md)** — entry point for all documentation.

## Getting started

Requires Node 26.x (see `.nvmrc`) and pnpm.

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm lint     # ESLint 10 (lean flat config)
pnpm build    # production build + type-check
```

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 6 · Tailwind CSS 4 · ESLint 10 ·
Better Auth · Prisma 7 · Neon Postgres · Cloudinary · Vercel.
