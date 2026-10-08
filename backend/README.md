# DialSafe Backend

REST API and database layer for the DialSafe scam number checker and official brand care directory.

**Owner role:** Member 2 (Backend and Database)  
**Stack:** Node.js (v18+) + Express, PostgreSQL (`pg` connection pool, no ORM)  
**Deployment target:** Render Web Service (HTTPS)

---

## 1. Prerequisites & Installation

- Node.js (v18 or higher) and npm
- A PostgreSQL database instance (e.g. free tier on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com))

Install dependencies:

```bash
cd backend
npm install
```

---

## 2. Environment Variables

Create a `.env` file inside `backend/` (or copy from `.env.example`):

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host/dbname?sslmode=require` |
| `PORT` | Local server port | `3000` |
| `FRONTEND_URL` | Frontend client origin (for CORS & detail links) | `http://localhost:5173` |
| `BASE_URL` | Deployed backend base URL | `http://localhost:3000` |
| `BOT_API_KEY` | Shared secret for WhatsApp bot rate limiter bypass (`x-bot-key`) | `change-me` |
| `DEMO_MODE` | If `true`, relaxes rate limits and duplicate report window | `false` |
| `DUPLICATE_WINDOW_MINUTES` | Window to suppress duplicate reports from same reporter | `10` |

---

## 3. Database Setup & Seed

1. **Apply schema and seed data:**
   ```bash
   npm run seed
   ```
   This executes `db/schema.sql`, upserts brands from `db/seed/brands.json`, and inserts sample reports from `db/seed/sample_reports.json`.

2. **Reset database for a clean demo:**
   ```bash
   npm run reset
   ```
   Truncates `reports` and `checks` tables and re-seeds clean sample data.

---

## 4. Running the Server

- **Development mode (auto-reload):**
  ```bash
  npm run dev
  ```
- **Production start:**
  ```bash
  npm start
  ```
- **Run tests:**
  ```bash
  npm test
  ```

---

## 5. API Endpoints & Example `curl` Commands

### `GET /health`
Verifies server uptime and database connectivity.
```bash
curl http://localhost:3000/health
```

### `POST /check`
Checks whether a phone number looks like a scam.
```bash
curl -X POST http://localhost:3000/check \
  -H "Content-Type: application/json" \
  -d '{"number": "+91 98765 43210", "brand": "Zomato"}'
```

### `POST /report`
Reports a suspected scam number.
```bash
curl -X POST http://localhost:3000/report \
  -H "Content-Type: application/json" \
  -d '{"number": "+91 98765 43210", "brand": "Zomato", "note": "Impersonated delivery agent asking for UPI pin", "source": "web"}'
```

### `GET /number/:n`
Retrieves risk assessment and community report history for a number.
```bash
curl http://localhost:3000/number/%2B919876543210
```

### `GET /brand/:name`
Looks up official contact number and verified source link for a brand.
```bash
curl http://localhost:3000/brand/Zomato
```

### `GET /brands`
Returns all verified brands for search/autocomplete.
```bash
curl http://localhost:3000/brands
```

### `GET /stats`
Retrieves dashboard totals and recent activity.
```bash
curl http://localhost:3000/stats
```

### `POST /whatsapp`
Twilio webhook placeholder (returns TwiML XML).
```bash
curl -X POST http://localhost:3000/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp%3A%2B919876543210&Body=hi"
```

### `POST /message`
Automated routing endpoint: classifies input as number check or brand lookup.
```bash
curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{"text": "Is +919876543210 safe for Zomato?"}'
```

---

## 6. Deployment Notes (Render)

1. Connect the GitHub repository to [Render](https://render.com) and create a new **Web Service**.
2. Set Root Directory to `backend`.
3. Set Build Command: `npm install`.
4. Set Start Command: `npm start`.
5. Add Environment Variables (`DATABASE_URL`, `FRONTEND_URL`, `BOT_API_KEY`, etc.).
6. **Important for Demo:** Free hosting services spin down when idle. Twilio webhooks timeout after 15 seconds. Configure a free ping monitor (e.g., [UptimeRobot](https://uptimerobot.com)) on `/health` every 5 minutes and ping `/health` manually a few minutes before the demo to ensure warm instances.
