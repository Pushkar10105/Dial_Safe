# bot/

WhatsApp bot: Twilio webhook, message routing, and reply formatting.

Owner role: Member 1 (WhatsApp Bot).

Read /AGENTS.md before making changes.

---

## Stack

| Choice | Reason |
|---|---|
| Node.js 18+ + Express | Same stack as backend; lightweight, fast webhook responses |
| Twilio WhatsApp sandbox | Quickest path to demo; no WhatsApp business approval needed |
| axios | HTTP client for backend API calls (12 s timeout, safe inside Twilio's 15 s window) |

Decision recorded in docs/DECISIONS.md on 2026-10-09.

---

## Folder layout

```
bot/
├── src/
│   ├── server.js       — Express app; /webhook Twilio endpoint, /health
│   ├── router.js       — Intent classification and dispatch
│   ├── client.js       — HTTP calls to the backend API
│   ├── formatters.js   — Convert API responses to WhatsApp text
│   └── config.js       — Load and validate environment variables
├── tests/
│   └── bot.test.js     — Unit tests (no Twilio or backend required)
├── cli-simulator.js    — Local terminal chat tester (calls real backend)
├── package.json
└── .env.example
```

---

## 1. Prerequisites

- Node.js 18+
- A running DialSafe backend (local or deployed). See `backend/README.md`.
- A Twilio account with the WhatsApp sandbox enabled (for live WhatsApp testing).

---

## 2. Installation

```bash
cd bot
npm install
```

---

## 3. Environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description |
|---|---|
| `BACKEND_URL` | Base URL of the backend, e.g. `http://localhost:3000` or `https://dialsafe-api.onrender.com` |
| `BOT_API_KEY` | Must match the `BOT_API_KEY` set in `backend/.env` |
| `FRONTEND_URL` | Frontend URL for building detail links in replies, e.g. `http://localhost:5173` |
| `TWILIO_ACCOUNT_SID` | From your Twilio console |
| `TWILIO_AUTH_TOKEN` | From your Twilio console |
| `TWILIO_WHATSAPP_NUMBER` | Sandbox number e.g. `whatsapp:+14155238886` |
| `PORT` | Port for the bot server (default: `4000`) |
| `SKIP_TWILIO_VALIDATION` | Set `true` in local dev to skip Twilio signature check |

---

## 4. Running

### Development (auto-reload, no Twilio required)

First test logic using the CLI simulator — calls real backend, no ngrok:

```bash
npm run simulate
```

### Development with Twilio webhook

1. Start the bot server:
   ```bash
   npm run dev
   ```
2. Expose it publicly using ngrok:
   ```bash
   ngrok http 4000
   ```
3. Copy the ngrok HTTPS URL (e.g. `https://abc123.ngrok.io`).
4. In the [Twilio Console → Sandbox settings](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn), set the **"When a message comes in"** webhook to:
   ```
   https://abc123.ngrok.io/webhook
   ```
5. On your demo phone, send the sandbox join message (e.g. `join <your-sandbox-word>`) to the Twilio sandbox number.

### Production (Render or similar)

1. Deploy `bot/` as a separate Node.js web service on Render (or run alongside the backend).
2. Set all environment variables in the Render dashboard.
3. Set the Twilio webhook to your Render service URL `/webhook`.

---

## 5. Running tests

```bash
npm test
```

Tests use a stubbed backend client — no network calls needed.

---

## 6. Intent routing reference

| User sends | Intent | Bot action |
|---|---|---|
| `hi`, `hello`, `help`, `menu` | HELP | Returns usage instructions |
| `report 9876543210 [note]` | REPORT | Calls `POST /report`, confirms submission |
| Any text with a phone number | NUMBER CHECK | Calls `POST /message` → formats verdict |
| `Zomato care number` | BRAND LOOKUP | Calls `POST /message` → formats official numbers |
| Unknown text | UNRECOGNIZED | Honest "not in our list" reply |

---

## 7. Verdict reply format

Every verdict reply includes:
- Emoji + verdict label (🚨 High risk / ⚠️ Suspicious / ✅ Verified official / ❓ Unknown)
- Reasons list
- Safety advice (OTP warning + 1930 / cybercrime.gov.in for High risk)
- Link to the website detail page for that number

**The bot never says "safe".** Unknown is a valid and honest answer.

---

## 8. Demo checklist

Before the demo:
1. Every demo phone must have joined the Twilio sandbox (send the join code once).
2. Start (or wake) the backend at least 2 minutes before demo time.
3. Run `npm run simulate` to confirm backend connectivity.
4. Have ngrok running and the webhook URL set in Twilio console.
