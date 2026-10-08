# Data Rules

These rules apply to everyone who adds, edits, or generates data in this project. They exist because wrong phone numbers are worse than no data at all.

## Official numbers

- **Official numbers must come only from the company's own website or official app.** Do not use numbers found on third-party sites, social media, or search results.
- Every official number entry must store:
  - `sourceUrl` — the exact URL where the number was found.
  - `lastChecked` — the date it was verified (YYYY-MM-DD).
- Cover **15–20 brands well** rather than many brands poorly. Priority: banks, major e-commerce, payments, delivery apps.
- If a number is no longer listed on the company's site, remove it or mark it stale. Do not leave outdated numbers in the verified list.

## AI and automation

- **Never let an AI model generate, recall, or guess phone numbers.** AI models can hallucinate numbers; a wrong official number here would actively harm users.
- This restriction applies to all agents and all team members using AI assistants.
- If you are unsure of an official number, leave the field blank and note the source gap rather than guessing.

## Sample and test data

- Test data must use **obviously fake numbers** — for example `+91 00000 00000`.
- Every sample or seeded scam entry must be marked `"sample": true` in the data file.
- Do not use a real individual's number as a scam example without documented evidence from a public advisory.
- Scam entries may only come from **public scam advisories** or from clearly fake test numbers.

## Verdicts

- Allowed verdicts: `Verified official`, `High risk`, `Suspicious`, `Unknown`.
- **Never use the word "safe"** or any phrase that implies a number is guaranteed safe. Detection is a risk estimate, not proof.
- `Unknown` is a valid and honest answer.

## Database tables

The schema is agreed between Member 4 (detection) and Member 2 (backend). The three core tables are:

| Table | Key fields |
|---|---|
| `brands` | name, aliases, officialNumbers, sourceUrl, lastChecked |
| `reports` | number, brand, note, createdAt |
| `checks` | number, verdict, createdAt |

A seed script and a one-command reset script (owned by Member 5) must be able to restore a clean demo state at any time.
