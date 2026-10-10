# DialSafe — Vercel deployment (manual repo setup)

This repository contains a Vite/React frontend and a separate Express/PostgreSQL backend.
Vercel hosts the **frontend**; deploy the backend separately (for example, as a Render Web Service).

## 1. Push these files to GitHub

Upload the contents of this project folder (`Dial_Safe-main`) to your GitHub repository.
The root `vercel.json` is configured to build `frontend/` while keeping the repository root as Vercel's Root Directory.

## 2. Deploy the frontend on Vercel

1. In Vercel, select **Add New → Project** and import this GitHub repository.
2. Keep **Root Directory** set to `./` (repository root). Do not select `frontend` as the root while using the root `vercel.json`.
3. Framework preset: **Vite** (or let Vercel detect it).
4. Build and output settings are configured in `vercel.json`:
   - Install command: `npm --prefix frontend ci`
   - Build command: `npm --prefix frontend run build`
   - Output directory: `frontend/dist`
5. Click **Deploy**.

The rewrite in `vercel.json` makes client-side React Router URLs load directly instead of returning a 404.

## 3. Configure the API URL

The frontend can run in fallback/demo mode without a backend, but checks/reports then use local fallback behavior and are **not shared persistent database records**.

For real backend data, deploy `backend/` as a separate Node web service and configure its PostgreSQL database first.

In Vercel → Project → Settings → Environment Variables, add:

- `VITE_API_URL` = `https://YOUR-BACKEND-DOMAIN` (base URL only; do not add `/check` or a trailing slash)

Apply it to Production (and Preview if needed), then **redeploy** the frontend. Vite environment variables are embedded at build time.

Do not set `VITE_API_URL` to `localhost`, `127.0.0.1`, or a temporary local tunnel for a permanent public deployment. Visitors' browsers cannot reliably access your computer's local server.

## 4. Deploy backend separately (required for shared/live data)

Create a Render **Web Service** from this same GitHub repository:
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Add backend environment variables in Render:
- `DATABASE_URL` = your hosted PostgreSQL connection string (for example from Neon or Supabase)
- `FRONTEND_URL` = your deployed Vercel origin, e.g. `https://your-project.vercel.app`
- `NODE_ENV` = `production`

Optional, depending on features:
- `BOT_API_KEY` = a long random secret if you use the bot bridge
- `BASE_URL` = your deployed backend URL
- `DEMO_MODE` = `false`

Then initialize the PostgreSQL schema/seed data according to `backend/README.md` (the `npm run seed` command requires the database URL and appropriate permissions). Use the backend's `/health` endpoint to confirm it starts.

**Important:** Check `backend/src/server.js` CORS rules before production use. The current implementation's origin callback is permissive and allows all origins; `FRONTEND_URL` is not an effective restriction until that callback is tightened. Do not treat CORS as authentication or abuse protection.

## 5. Gemini voice assistant (optional)

If you want Gemini responses, `VITE_GEMINI_API_KEY` may be set in Vercel, but any `VITE_*` value is exposed to the browser. A key embedded in the frontend is public and can be extracted by visitors. For a production app, proxy Gemini requests through a backend endpoint and keep the secret server-side. Without a Gemini key, the app has its built-in browser/local fallback.

## 6. Quick troubleshooting

- **Blank page / 404 on nested URL:** confirm root `vercel.json` is committed and Root Directory is `./`.
- **API requests fail:** confirm `VITE_API_URL` is the deployed backend's HTTPS base URL, backend is online, and database variables/schema are correct.
- **Changes to environment variables have no effect:** redeploy after changing `VITE_*` variables.
- **Build error:** use a supported Node.js version (Node 22 is specified in `.nvmrc`); run `npm --prefix frontend ci` and `npm --prefix frontend run build` locally.
- **Frontend still displays demo results:** backend URL may be unset/unreachable; fallback data is expected in that case.

## What is and isn't deployment-ready

The Vercel configuration is included, and the frontend build is the Vercel deployment target. Vercel does not host the Express/PostgreSQL service as a normal static Vite site; the backend and database must be deployed/configured separately for persistent shared functionality.
