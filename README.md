# DialSafe

DialSafe is a WhatsApp bot and website that helps people avoid fake customer care numbers. Users can check whether a phone number looks like a scam and look up a company's official customer care number. Both channels share one backend and one database.

**Deadline: 10 October 2026.**

---

## Folder and owner table

| Folder | What lives here | Owner |
|---|---|---|
| `bot/` | WhatsApp bot (Twilio webhook, message routing, reply formatting) | Member 1 |
| `backend/` | REST API and database connection | Member 2 |
| `frontend/` | Website (number checker, brand lookup, report form, dashboard) | Member 3 |
| `detection/` | Number-check logic (normalisation, scoring, verdict) | Member 4 |
| `data/` | Brand seed data and sample scam reports | Member 5 |
| `tests/` | Test cases and demo reset script | Member 5 |
| `docs/` | Shared documentation | Everyone |

## Running each folder

Each owner documents how to install dependencies and run their own folder in that folder's `README.md` once their stack is chosen. See `docs/DECISIONS.md` for current stack status.

## Key docs

- `docs/memory.md` — full project context and background decisions
- `docs/API_CONTRACT.md` — the single source of truth for all endpoints
- `docs/DATA_RULES.md` — rules for handling phone numbers and brand data
- `docs/DECISIONS.md` — stack choices and decision log
- `docs/DEMO_SCRIPT.md` — the five-step demo flow
- `AGENTS.md` — rules for every AI agent working in this repo
- `CONTRIBUTING.md` — git workflow

## Quick start

1. Copy `.env.example` to `.env` and fill in values.
2. Go to the folder you own and follow its `README.md`.
3. Read `AGENTS.md` before using any AI assistant in this repo.
