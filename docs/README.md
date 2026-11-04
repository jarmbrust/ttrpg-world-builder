# TTRPG World Builder — Documentation

Planning and architecture docs for the **TTRPG World Builder** platform.

**What it is:** a multi-tenant campaign wiki for tabletop RPGs, built with Next.js 16 + Postgres
and deployed on Vercel at `ttrpgworldbuilder.com`. GMs create worlds and author lore; players read
and (optionally) maintain their own characters. Lore lives in Postgres, never in git.

## Index

- **[Architecture](architecture.md)** — stack, pinned versions, and key decisions (including why
  Better Auth rather than NextAuth, and the multi-tenant model).
- **[Data Model](data-model.md)** — multi-tenant Prisma schema, roles, and the URL map.
- **[Implementation Plan](implementation-plan.md)** — phased build plan with task checklists.

## Build status

- [x] Phase 0 — scaffold + docs
- [ ] Phase 1 — repo, deploy, database
- [ ] Phase 2 — multi-tenant schema + migrations
- [ ] Phase 3 — auth + platform roles + memberships
- [ ] Phase 4 — world creation + GM authoring
- [ ] Phase 5 — player-facing world site
- [ ] Phase 6 — directory + request-access + GM dashboard
- [ ] Phase 7 — images (Cloudinary)
- [ ] Phase 8 — quotas + platform admin + export
- [ ] Phase 9 — polish + security hardening
