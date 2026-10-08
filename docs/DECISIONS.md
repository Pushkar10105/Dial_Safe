# Decisions

Stack and tooling choices for each area. Update this table when a decision is made. Add a dated entry to the Decision log below.

## Decision table

| Area | Stack / choice | Decided by | Date |
|---|---|---|---|
| Bot | TBD | — | — |
| Backend | Node.js (18+) + Express | Member 2 | 2026-10-08 |
| Database | PostgreSQL (pg connection pool, Neon/Supabase) | Member 2 | 2026-10-08 |
| Frontend | TBD | — | — |
| Detection | TBD | — | — |
| Hosting | Render (Express Web Service) | Member 2 | 2026-10-08 |

## Decision log

### 2026-10-08 — Chose Node.js + Express and PostgreSQL for backend
Decided by Member 2. We picked Node.js + Express because it is lightweight, quick to scaffold, and integrates well with Twilio webhook handling and modern hosting. We picked PostgreSQL with the raw `pg` connection pool (no ORM) for reliability and simplicity on free tiers like Neon or Supabase. Render was selected as the deployment target to provide a public HTTPS URL.

