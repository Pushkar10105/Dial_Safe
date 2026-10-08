# DialSafe: Project Memory / Handoff File

> Purpose: this file transfers the full context of a planning chat to any other agent or chat. Read it top to bottom before helping. Everything here was decided in that conversation unless it is listed under "Open items".

---

## 1. One-line summary

**DialSafe** is a **WhatsApp bot + website** that helps people avoid fake customer care numbers. Users can:
1. **Check** whether a phone number looks like a scam.
2. **Look up** a company's **official customer care number**.

Both channels use **one shared backend and one shared database**.

## 2. Context

- Student group project, **team of 5**.
- **Deadline: 10 October 2026.** The planning chat took place on 8 October 2026, so roughly two days remain. Scope was cut hard for that reason.
- The user is the team lead who will assign work to four teammates. They want **bullet-point role assignments** (what each person makes and which area they own), not hour-by-hour schedules. Teammates will work out implementation details themselves.
- Earlier in the chat the user explored Raspberry Pi / Arduino ideas for fixing college wifi issues. That topic is **not part of this project** and is not carried over.

## 3. Core idea (the user's own concept)

A normal user types a phone number into WhatsApp. The bot works out whether it looks fraudulent and alerts the user. This was then extended with a brand lookup: the user can ask for a company's official customer care number, on WhatsApp or on the website.

Why it matters: many scams start when a person searches for "customer care" and lands on a fake number. The product lets them verify a number first, or fetch the real one from a trusted list.

## 4. Features (in scope)

### WhatsApp bot
- Send a number (optionally with a brand name) -> get a verdict, reasons, and what to do next.
- Send something like "Zomato care number" or "official number for Zomato" -> get the official number, its source link, and the last-checked date.
- `report <number>` -> flags a scam number.
- `hi` / `help` -> short instructions.
- Clear replies for invalid numbers or unrecognized input.
- Every verdict reply includes a link to that number's page on the website.

### Website
- Number checker (same result as the bot).
- Number detail page: verdict, reasons, report count, official number if known.
- "Find official number" search plus a page per brand (official number, source link, last-checked date, known fake numbers for that brand).
- Report form for scam numbers.
- Dashboard of recent checks and reports.
- "Chat on WhatsApp" button and QR code.

### How the two channels connect (the demo story)
- The bot's reply links to the website page for that number.
- A report submitted on the website raises that number's risk the next time anyone checks it on WhatsApp.
- A report sent on WhatsApp appears on the website.

## 5. Out of scope (cut for time)

- User accounts, login, and linking a WhatsApp number to a website account.
- Per-user history.
- Brands that are not in the verified list.
- Any claim that a number is "safe".

## 6. Verdicts

| Verdict | Colour | Meaning |
|---|---|---|
| Verified official | Green | Matches the brand's official number list |
| High risk | Red | Strong signals of a scam (for example many reports, or it is not the official number for the named brand) |
| Suspicious | Yellow | Some warning signs; advise checking the company's official site |
| Unknown | Grey | Cannot confirm either way |

**Rule: never say "safe".** "Unknown" is a valid and honest answer. A false "safe" is worse than no answer.

High-risk replies should include: do not share OTPs or PINs; report at **cybercrime.gov.in** or call **1930** (India's national cybercrime helpline).

Example reply: "High risk. Reported 14 times, and this isn't the official number for [brand]. Don't share OTPs or PINs. Report at cybercrime.gov.in or call 1930. Details: [link]"

## 7. How the backend decides what a message is

- If the message contains a phone number -> run a **number check** (brand name optional).
- Otherwise -> treat it as a **brand lookup**.
- Brand names are matched loosely through an alias list (for example "zomato", "Zomato Ltd", "zomato care").
- If the brand is not in the list, say so and tell the user to check the company's own website or app. Do not guess.

## 8. Detection logic (inputs to the verdict)

- **Normalize** the number (India +91 format; strip spaces, dashes, brackets).
- Compare against the brand's **official numbers**.
- Use **report counts** from the database (reports from both channels).
- Apply a few **simple rules** (for example a regular mobile number claiming to be a company care line, other pattern checks).
- Combine into a **score**, a **verdict**, and a list of **human-readable reasons**.

## 9. Data rules (important)

- **Official numbers must come only from the company's own website or app.** Store the source URL and the date checked for every entry.
- **Never let an AI model generate, recall, or guess phone numbers.** A wrong number here is worse than none.
- Cover **15-20 brands well** rather than many poorly (banks, major e-commerce, payments, delivery apps, and so on; the exact list is still to be chosen).
- Scam numbers come only from **public scam advisories or clearly fake test numbers**, and seeded entries must be **labelled as sample data**. Do not mark a real individual's number as a scam without evidence.

## 10. Architecture

- WhatsApp channel: **Twilio WhatsApp sandbox** (chosen as the quickest route for a demo). Meta's WhatsApp Cloud API is the alternative if someone already has it set up.
- **Avoid unofficial WhatsApp libraries** such as whatsapp-web.js for the real build. They violate WhatsApp's terms and can get the number banned.
- One backend serves both the bot webhook and the website.
- Backend must be reachable on a **public HTTPS URL** (the webhook needs it).
- Frontend and backend technology is **not fixed**; the team uses whatever it already knows (for example React plus Node, or FastAPI).

### Database

A small database is needed so the bot and website share live data.

- `brands`: name, aliases, official numbers, source URL, last-checked date. This can start as a JSON seed file.
- `reports`: number, brand, note, created at.
- `checks`: number, verdict, created at (only needed for the dashboard).

Hosting choice:
- **SQLite** is the quickest but many free hosts wipe the disk on restart or redeploy, so reports could vanish before the demo.
- A **free hosted database** (MongoDB Atlas, or Postgres on Supabase or Neon) survives restarts and is the safer pick on a free host.
- Whichever is used, build a **seed script plus a one-command reset** to restore a clean demo state.

## 11. Proposed API contract (shared by everyone; field names may be adjusted but must be agreed and then kept stable)

- `POST /check`: body `{ number, brand? }` -> `{ number (normalized), verdict, score, reasons[], reportCount, brand?, officialNumber?, detailUrl }`
- `POST /report`: body `{ number, brand?, note? }` -> `{ ok, reportCount }`
- `GET /number/:n`: the check result plus a summary of reports for that number
- `GET /brand/:name`: `{ brand, officialNumbers[], sourceUrl, lastChecked, knownFakeNumbers[] }`
- `GET /stats`: `{ totals, recentChecks[], recentReports[] }`

`/check` also reads the brand table, so a number that matches a brand's official list returns "Verified official".

## 12. Team split (5 roles)

Team member names were not given in the chat; roles are numbered.

### Member 1: WhatsApp Bot
- Set up the Twilio WhatsApp sandbox and the webhook that receives messages.
- Classify each message: number check, brand lookup, `report <number>`, `hi`/`help`, or unrecognized.
- Call the backend (`/check`, `/brand`, `/report`) and send back the reply.
- Format replies to be short and clear: verdict, reasons, next steps, website link.
- Handle bad input (invalid numbers, random text).
- **Done when:** a message on WhatsApp gets a correct reply.

### Member 2: Backend and Database Connection
- Create the hosted database and share the connection string with the team.
- Build the five endpoints.
- Write the queries for saving and reading reports and checks.
- Call the detection engine from `/check`.
- Deploy the backend to a public URL.
- **Done when:** all endpoints work from a public URL and data persists across restarts.

### Member 3: Frontend
- Number checker page.
- Number detail page.
- "Find official number" search and brand pages.
- Report form.
- Dashboard of recent checks and reports.
- "Chat on WhatsApp" button and QR code.
- Four verdict styles (green, red, yellow, grey).
- **Done when:** every feature works against the live API.

### Member 4: Detection Engine and Schema
- Normalize phone numbers.
- Brand matching with aliases.
- Compare numbers against a brand's official numbers.
- Rules and scoring that produce one verdict plus reasons.
- Agree the table schema (`brands`, `reports`, `checks`) with Member 2.
- Never return "safe".
- **Done when:** a function takes a number (and optional brand) and returns verdict, score, and reasons.

### Member 5: Data, Testing and Demo
- Collect 15-20 brands' official customer care numbers from each company's own website or app, with source link and last-checked date (this can be split with Member 4 if needed).
- Build the seed file and a script that loads it into the database, plus clearly labelled sample scam reports.
- Add a one-command reset for a clean demo state.
- Write about 20 test cases: valid and invalid numbers, brand typos, unknown brands, repeated reports.
- Write the demo script, slides, and README.
- **Done when:** the database loads with real brand data and the whole flow works end to end in the demo.

## 13. Demo flow

1. Ask the bot for a brand's official number.
2. Check a fake number and show the high-risk reply.
3. Open the detail link on the website.
4. Submit a report on the website.
5. Re-check the same number on WhatsApp to show the updated report count.

## 14. Known risks and practical notes

- Every demo phone must **join the Twilio sandbox** (by sending the join code) before the demo, or the bot will not reply to it.
- If the backend sits on a free host that sleeps when idle, **open it a few minutes before the demo** to wake it up.
- Data quality is the product. Wrong or outdated official numbers would undermine it, so store source and date for each one.
- Detection is a risk estimate with reasons, not proof. Present it that way.

## 15. Open items (not yet decided)

- Exact backend and frontend stack.
- Which database was finally chosen.
- The final list of 15-20 brands.
- Final field names in the API responses (the contract above is a proposal).
- Team member names mapped to the five roles.

## 16. How an agent picking this up should help

- Keep answers concise and practical; the deadline is tight.
- Stay within the scope above; push back politely on scope creep.
- Give role-based bullet points rather than day-by-day schedules unless asked.
- Be honest about limits (for example, no system can reliably label every number as fraud).</p>
- Do not invent phone numbers, brand data, or scam reports.
