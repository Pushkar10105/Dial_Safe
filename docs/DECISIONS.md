# Decisions

Stack and tooling choices for each area. Update this table when a decision is made. Add a dated entry to the Decision log below.

## Decision table

| Area | Stack / choice | Decided by | Date |
|---|---|---|---|
| Bot | TBD | — | — |
| Backend | Node.js (18+) + Express | Member 2 | 2026-10-08 |
| Database | PostgreSQL (pg connection pool, Neon/Supabase) | Member 2 | 2026-10-08 |
| Frontend | React + Vite (Vanilla CSS) | Member 3 | 2026-10-09 |
| Detection | Node.js (pure JavaScript / CommonJS library) | Member 4 | 2026-10-09 |
| Hosting | Render (Express Web Service) | Member 2 | 2026-10-08 |

## Decision log

### 2026-10-09 — Chose React + Vite and Multilingual Gemini Voice Assistant for frontend
Decided by Member 3. React + Vite was chosen for high performance, modern UI ergonomics, and reactive audio/speech state management. For accessibility and protection for elderly users, a multilingual AI Voice Assistant (English, Hindi, Tamil) is integrated powered by Google Gemini API with a zero-config fallback to native browser Web Speech API (STT & TTS) so it functions out-of-the-box everywhere.

### 2026-10-09 — Chose Node.js (CommonJS) pure library for detection engine
Decided by Member 4. Implemented as a lightweight, zero-dependency pure function library in Node.js / CommonJS. It handles phone number normalisation, classification, brand alias matching, heuristics, risk scoring, and verdict generation. Being a pure in-memory module, it runs deterministically without network overhead or database dependencies.

### 2026-10-08 — Chose Node.js + Express and PostgreSQL for backend
Decided by Member 2. We picked Node.js + Express because it is lightweight, quick to scaffold, and integrates well with Twilio webhook handling and modern hosting. We picked PostgreSQL with the raw `pg` connection pool (no ORM) for reliability and simplicity on free tiers like Neon or Supabase. Render was selected as the deployment target to provide a public HTTPS URL.

