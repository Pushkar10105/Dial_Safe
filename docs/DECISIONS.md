# Decisions

Stack and tooling choices for each area. Update this table when a decision is made. Add a dated entry to the Decision log below.

## Decision table

| Area | Stack / choice | Decided by | Date |
|---|---|---|---|
| Bot | Node.js (18+) + Express + Twilio SDK (official) | Member 1 | 2026-10-09 |
| Backend | Node.js (18+) + Express | Member 2 | 2026-10-08 |
| Database | PostgreSQL (pg connection pool, Neon/Supabase) | Member 2 | 2026-10-08 |
| Frontend | TBD | — | — |
| Detection | TBD | — | — |
| Hosting | Render (Express Web Service) | Member 2 | 2026-10-08 |

## Decision log

### 2026-10-08 — Chose Node.js + Express and PostgreSQL for backend
Decided by Member 2. We picked Node.js + Express because it is lightweight, quick to scaffold, and integrates well with Twilio webhook handling and modern hosting. We picked PostgreSQL with the raw `pg` connection pool (no ORM) for reliability and simplicity on free tiers like Neon or Supabase. Render was selected as the deployment target to provide a public HTTPS URL.

### 2026-10-09 — Chose Node.js + Express + official Twilio SDK for the bot
Decided by Member 1. Node.js + Express matches the backend stack, keeping the project consistent. The official `twilio` npm package is used for webhook signature validation and TwiML generation. `axios` is the HTTP client for calling the backend API. The bot server is kept intentionally thin: all message classification logic is delegated to the backend's `POST /message` endpoint so the bot does not duplicate detection logic. `SKIP_TWILIO_VALIDATION=true` is provided for local development without ngrok.

