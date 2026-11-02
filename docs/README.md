# World of Varun — Documentation

Planning and architecture docs for the **World of Varun** campaign website.

**What it is:** a read-mostly lore wiki for a tabletop RPG campaign (a D&D 5e-like system),
built with Next.js 16 + Postgres, deployed on Vercel at `worldofvarun.com`. The Game Master
(GM) authors and curates the world; players read and (optionally) maintain their own character
page.

## Index

- **[Architecture](architecture.md)** — stack, pinned versions, and the key decisions
  (including why Better Auth rather than NextAuth, and why content lives in the DB, not git).
- **[Data Model](data-model.md)** — Prisma schema, the access-control model, content types,
  and the URL map.
- **[Implementation Plan](implementation-plan.md)** — phased build plan with task checklists.

## Build status

- [x] Phase 0 — scaffold + docs
- [ ] Phase 1 — repo, deploy, database
- [ ] Phase 2 — Prisma schema + migrations
- [ ] Phase 3 — authentication (Better Auth)
- [ ] Phase 4 — content + GM admin editor
- [ ] Phase 5 — player-facing site
- [ ] Phase 6 — images (Cloudinary)
- [ ] Phase 7 — seed content + polish
