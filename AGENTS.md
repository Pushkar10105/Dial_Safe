# AGENTS.md: rules for every AI agent working in this repo

You are helping on DialSafe, a student project due 10 Oct 2026. Read these files before any task: docs/memory.md (full context), docs/API_CONTRACT.md, docs/DATA_RULES.md, docs/DECISIONS.md. If a task conflicts with them, stop and ask the human.

## What the product is
A WhatsApp bot plus a website that (1) checks whether a phone number looks like a scam and (2) looks up a company's official customer care number. One shared backend and database. Scope is fixed in docs/memory.md. Do not add features outside it. Out of scope: user accounts, login, per-user history, account linking.

## Folder ownership
- bot/ = Member 1 (WhatsApp bot)
- backend/ = Member 2 (API and database)
- frontend/ = Member 3 (website)
- detection/ = Member 4 (number-check logic)
- data/ and tests/ = Member 5 (seed data, tests, demo)
- docs/ = shared

Only edit files inside the folder of the person you are helping. If a change is needed in another folder, do not make it. Describe what is needed so the human can ask that owner or open an issue. Changes to shared files (docs/, root config) must be small, mentioned in the PR description, and never silently remove other people's content.

## Anti-hallucination rules (most important)
1. Never invent facts. This includes phone numbers, company care numbers, URLs, brand data, scam reports, API fields, endpoints, library functions, package names, version numbers, or config options. If you are not certain something exists, say so and check the docs or the actual installed code. If you cannot verify it, ask the human.
2. Never generate phone numbers. Official numbers come only from a company's own website or app and are stored with a sourceUrl and lastChecked date. Sample or test data must use obviously fake numbers (for example +91 00000 00000) and be marked "sample": true.
3. Do not guess what other folders contain. Read the code or the API contract. The contract is the only interface between folders.
4. Do not claim something works unless you ran it. When reporting, state what you ran, what passed, and what you did not test. Never fabricate test output.
5. Do not leave placeholder or fake implementations that look finished. Mark unfinished work clearly with TODO and tell the human.
6. When requirements are unclear, list your assumptions and ask. Do not silently pick one.

## Product rules
- Verdicts are only: Verified official, High risk, Suspicious, Unknown. Never output "safe" or any wording that implies a number is guaranteed safe.
- "Unknown" is a valid answer. A false "safe" is worse than no answer.
- High-risk replies include: do not share OTPs or PINs; report at cybercrime.gov.in or call 1930.
- Detection is a risk estimate with reasons, not proof. Always return human-readable reasons with the verdict.
- Message routing rule: if a message contains a phone number, run a number check; otherwise treat it as a brand lookup. Unknown brands get an honest "not in our list; check the company's official website or app", never a guess.
- WhatsApp: use the Twilio WhatsApp sandbox. Do not use unofficial WhatsApp libraries (for example whatsapp-web.js); they violate WhatsApp's terms.
- Bot replies are short and plain. Every verdict reply links to that number's page on the website.

## API contract
docs/API_CONTRACT.md is the source of truth. If you must change it, update the contract in the same PR, flag it in the PR template, and tell the human so consumers of that endpoint are told. Never change a response shape in code without updating the contract.

## Stack and dependencies
- The team chooses stacks per folder. Check docs/DECISIONS.md first. If your area is TBD, propose a simple choice to the human, get a yes, and record it in docs/DECISIONS.md before scaffolding.
- Do not switch stacks or add large frameworks without asking. Prefer few, well-known dependencies. Do not add a dependency just to save a few lines.
- Every folder that gets a stack must document in its own README how to install and run it.

## Secrets and safety
- Never commit secrets, tokens, or connection strings. Use environment variables and keep .env.example updated with variable names only.
- Do not log full phone numbers of real users anywhere beyond what the product needs.
- Do not delete or overwrite data files without asking.

## Working style
- Small, focused changes. One task per branch and pull request.
- Follow the git workflow in CONTRIBUTING.md. Never push to main or force push.
- Match the existing conventions in the folder you are editing before introducing new ones.
- Add or update tests for logic you change. Run existing tests before finishing.
- Keep user-facing text simple and clear. Keep code readable over clever.
- Record meaningful decisions in the Decision log in docs/DECISIONS.md with a date.
- If you notice a problem outside your folder or outside your task, report it instead of fixing it.
