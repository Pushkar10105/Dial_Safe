# Decisions

Stack and tooling choices for each area. Update this table when a decision is made. Add a dated entry to the Decision log below.

## Decision table

| Area | Stack / choice | Decided by | Date |
|---|---|---|---|
| Bot | Node.js (18+) + Express + Twilio SDK (official) | Member 1 | 2026-10-09 |
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

### 2026-10-09 — Chose Node.js + Express + official Twilio SDK for the bot
Decided by Member 1. Node.js + Express matches the backend stack, keeping the project consistent. The official `twilio` npm package is used for webhook signature validation and TwiML generation. `axios` is the HTTP client for calling the backend API. The bot server is kept intentionally thin: all message classification logic is delegated to the backend's `POST /message` endpoint so the bot does not duplicate detection logic. `SKIP_TWILIO_VALIDATION=true` is provided for local development without ngrok.
### 2026-10-10 — Expanded verified brands directory to 22 daily-use Indian brands per DATA_RULES.md
Decided by Team. In accordance with the 15–20 brand scope in DATA_RULES.md, expanded the verified directory across backend seed data and frontend to 22 essential daily-use Indian brands across Banking (SBI, HDFC, ICICI, Axis, Kotak, PNB), Payments (Paytm, Google Pay, PhonePe), Telecom (Jio, Airtel, Vi), Food & Quick-Commerce (Zomato, Swiggy, Blinkit, Zepto), E-Commerce (Flipkart, Amazon, Meesho), Transit (IRCTC), and Government Helplines (1930 Cybercrime, 1915 Consumer Helpline). All phone entries are verified against corporate websites with exact URLs, dates, and multilingual aliases (English, Hindi, Tamil). Services with no telephone care are explicitly documented with app-only guidance.
