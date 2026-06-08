# Deployment Guide

## Prerequisites

- A [Neon](https://neon.tech) account (free tier)
- A [Render](https://render.com) account (free tier)
- The repo pushed to GitHub with GitHub Pages enabled

---

## 1. Neon (database)

1. Create a new Neon project at https://console.neon.tech
2. Copy the connection string from the dashboard (it looks like `postgres://user:pass@host/db?sslmode=require`)
3. Create `server/.env` from `server/.env.example` and paste the URL as `DATABASE_URL`
4. Push the schema:
   ```bash
   cd server && npm run db:push
   ```
   Expected: drizzle-kit confirms all four tables created.

---

## 2. Render (server)

1. Go to https://dashboard.render.com → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root directory:** `server`
   - **Build command:** `npm install && npm run build`
   - **Start command:** `node dist/index.js`
   - **Instance type:** Free
4. Add environment variables:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon connection string |
   | `JWT_SECRET` | A long random string (generate with `openssl rand -hex 32`) |
   | `CLIENT_ORIGIN` | `https://<your-github-username>.github.io` |
5. Deploy. Render gives you a URL like `https://application-tracker-xyz.onrender.com`

---

## 3. Client (GitHub Pages)

1. Create `client/.env` from `client/.env.example` and set `VITE_API_URL` to your Render URL.
   - For GitHub Pages CI, add `VITE_API_URL` as a repository secret and inject it in `deploy.yml`:
     ```yaml
     - name: Build
       working-directory: client
       run: npm run build
       env:
         VITE_API_URL: ${{ secrets.VITE_API_URL }}
     ```
2. Enable GitHub Pages: repo Settings → Pages → Source = **GitHub Actions**
3. Push to `main` — the workflow deploys automatically.

---

## 4. Notes

- **Render free tier** spins down after 15 min of inactivity. The first request after idle takes ~50 s (cold start). This is expected and acceptable.
- **Neon free tier** auto-suspends; the first query after suspend takes ~1–2 s. Also expected.
- To update the schema in future: edit `server/src/db/schema.ts`, run `npm run db:push` (or `db:generate` + `db:migrate` for production migrations).
