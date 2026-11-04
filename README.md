# TTRPG World Builder

A multi-tenant campaign wiki for tabletop RPGs. Game Masters create and curate worlds;
their players read cross-linked lore, session recaps, maps, and characters — and maintain
their own characters. Content is authored as Markdown, stored in Postgres, and **never**
committed to this public repository. Built with Next.js 16 + Postgres and deployed on Vercel at
[ttrpgworldbuilder.com](https://ttrpgworldbuilder.com).

## What is it

- **Purpose:** let a GM stand up a private, cross-linked lore wiki for their campaign and share it
  with their players — without publishing the world to the open web.
- **Access:** a **platform admin** (the site owner), a **GM** per world, **players** per world, and
  anonymous visitors (a public world directory with one-line taglines only). Per-world read-only
  "viewer" access is available via a membership flag.
- **Privacy:** every world's lore lives in Postgres and is **never** committed to this public
  repository. GMs author in a private in-browser editor and "reveal" content as the campaign
  progresses.
- **Closed beta:** GMs are invited/approved by the platform admin; players join by request.
- **Status:** early scaffold — see the implementation plan for the phased roadmap.

## Index

- **[Architecture](docs/architecture.md)** — stack, pinned versions, key decisions, and access model.
- **[Data Model](docs/data-model.md)** — multi-tenant Prisma schema and URL map.
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

Node.js 26 · Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 6 · Tailwind CSS 4 ·
ESLint 10 · Better Auth · Prisma 7 · Neon Postgres · Cloudinary · Vercel.
