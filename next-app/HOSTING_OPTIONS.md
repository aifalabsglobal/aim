# Hosting options for AIFA (Next.js app)

Your app uses **Next.js 16**, **Prisma + PostgreSQL**, **Clerk**, and **Ollama** (remote URL). Below are practical hosting options.

---

## Quick comparison

| Option      | Best for           | Free tier | Postgres        | Notes                          |
|------------|--------------------|-----------|-----------------|--------------------------------|
| **Vercel** | Next.js, fast CDN  | Yes       | External (Neon) | Easiest for Next.js            |
| **Render** | All-in-one         | Yes       | Render Postgres | One place for app + DB         |
| **Railway**| Dev/staging        | $5 credit | Railway Postgres| Simple, good DX                 |
| **Netlify**| Next.js            | Yes       | External        | Similar to Vercel              |
| **Fly.io** | Full control       | Yes       | Fly Postgres    | Good for app + optional Ollama |
| **VPS**    | Full control       | No        | Self-managed    | Docker, your own server        |

---

## 1. Vercel (recommended for Next.js)

**Pros:** Zero-config Next.js, global CDN, serverless, free tier.  
**Cons:** Postgres and Ollama must be external.

### Steps

1. Push code to GitHub; connect repo at [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. **Root Directory:** set to `next-app` (or deploy from a monorepo with `next-app` as root).
3. **Build:** `npm run build` (default). **Output:** Next.js (default).
4. **Environment variables** (Vercel → Project → Settings → Environment Variables):

   | Variable                         | Value                    | Notes                    |
   |----------------------------------|--------------------------|--------------------------|
   | `DATABASE_URL`                   | `postgresql://...`       | From Neon/Supabase/etc.  |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk dashboard |                          |
   | `CLERK_SECRET_KEY`               | From Clerk dashboard     |                          |
   | `OLLAMA_BASE_URL`                | `http://45.198.59.91:11434` | Your Ollama server    |

5. **Postgres:** Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) (free tiers). Create DB → copy connection string → set `DATABASE_URL` on Vercel.
6. **Clerk:** In Clerk dashboard, add your Vercel domain (e.g. `yourapp.vercel.app`) to allowed origins.
7. Deploy. Run migrations once (e.g. locally with `DATABASE_URL` from Neon, or use Vercel’s “Run command” / a one-off script).

**Neon (free Postgres):** [neon.tech](https://neon.tech) → New project → copy `DATABASE_URL` → paste in Vercel env.

---

## 2. Render

**Pros:** App + Postgres in one place, free tier for both.  
**Cons:** Free instances sleep; cold starts.

### Steps

1. [render.com](https://render.com) → **New** → **Web Service**.
2. Connect GitHub; select repo. **Root Directory:** `next-app`.
3. **Runtime:** Node. **Build Command:** `npm install && npx prisma generate && npm run build`. **Start Command:** `npx prisma migrate deploy && npm start`.
4. **Environment:**

   | Variable                         | Value                    |
   |----------------------------------|--------------------------|
   | `DATABASE_URL`                   | From Render Postgres (below) |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk                  |
   | `CLERK_SECRET_KEY`               | Clerk                    |
   | `OLLAMA_BASE_URL`                | `http://45.198.59.91:11434` |

5. **Postgres:** **New** → **PostgreSQL**; create DB → copy **Internal Database URL** into `DATABASE_URL` (use internal URL so app and DB are in same network).
6. In Clerk, add your Render URL (e.g. `https://yourapp.onrender.com`) to allowed origins.
7. Deploy. Migrations run on start via `npx prisma migrate deploy`.

---

## 3. Railway

**Pros:** Simple UI, Postgres add-on, $5 free credit/month.  
**Cons:** Free credit only; then paid.

### Steps

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → select repo.
2. Set **Root Directory** to `next-app` (or add `railway.json` / configure in dashboard).
3. **Postgres:** In same project → **New** → **Database** → **PostgreSQL** → Railway sets `DATABASE_URL` automatically.
4. **Variables:** Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `OLLAMA_BASE_URL`.
5. **Build:** `npx prisma generate && npm run build`. **Start:** `npx prisma migrate deploy && npm start` (or use Railway’s detected commands and add migrate before start).
6. In Clerk, add Railway’s public URL.

---

## 4. Netlify

**Pros:** Good free tier, Next.js support.  
**Cons:** Postgres and Ollama external; some Next.js features need adapter.

### Steps

1. [netlify.com](https://netlify.com) → **Add new site** → **Import from Git** → select repo.
2. **Base directory:** `next-app`. **Build command:** `npm run build`. **Publish directory:** `.next` (or leave default if using Next.js runtime).
3. Use **Netlify Next.js runtime** (auto-detected when you use Next.js). Postgres = Neon/Supabase; set `DATABASE_URL`, Clerk keys, `OLLAMA_BASE_URL`.
4. Run migrations separately (e.g. from your machine with production `DATABASE_URL` or a Netlify build plugin / script).

---

## 5. Fly.io

**Pros:** Run app + optional Postgres (or external DB) on Fly; good for full control.  
**Cons:** More ops; you manage app and optionally DB.

### Steps

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/) and sign up.
2. In `next-app`: `fly launch` (creates `fly.toml`). Choose region; do **not** create Postgres yet if you use Neon.
3. **Secrets:** `fly secrets set DATABASE_URL="..." CLERK_SECRET_KEY="..." OLLAMA_BASE_URL="http://45.198.59.91:11434"` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."`.
4. **Build/start:** In `fly.toml` or Dockerfile, build with `npx prisma generate && npm run build`, start with `npx prisma migrate deploy && npm start`.
5. **Postgres:** Either **Fly Postgres** (`fly postgres create`) or Neon; set `DATABASE_URL` accordingly.
6. In Clerk, add `https://yourapp.fly.dev`.

---

## 6. VPS (DigitalOcean, Linode, etc.)

**Pros:** Full control; can run Next.js, Postgres, and (if you want) Ollama on same machine.  
**Cons:** You manage OS, Node, Postgres, process manager, SSL.

### Outline

1. Create a droplet/VM (e.g. Ubuntu).
2. Install Node 20+, PostgreSQL, and (optionally) Nginx.
3. Clone repo; in `next-app`: `npm ci`, `npx prisma generate`, `npm run build`.
4. Set env (e.g. in `.env.production` or systemd): `DATABASE_URL`, Clerk keys, `OLLAMA_BASE_URL`.
5. Run migrations: `npx prisma migrate deploy`.
6. Run app with **PM2** or systemd: `npm start` (or `node .next/standalone/server.js` if using standalone output).
7. Put Nginx (or Caddy) in front; use Let’s Encrypt for HTTPS.
8. In Clerk, add your domain.

**Docker:** You can add a `Dockerfile` and `docker-compose.yml` for Next.js + Postgres and deploy the stack on the VPS.

---

## Checklist before going live

- [ ] **Postgres:** Migrations run in production (`npx prisma migrate deploy`).
- [ ] **Clerk:** Production keys; add your deployed URL to Clerk dashboard.
- [ ] **Ollama:** `OLLAMA_BASE_URL` points to a reachable server (your app’s server must be able to call it; if app is on Vercel/Render, that’s the public URL you use).
- [ ] **Env:** No `.env.local` in repo; all secrets in the host’s environment variables.
- [ ] **Build:** `next-app` builds without errors; if root is repo root, set **Root Directory** to `next-app` on the host.

---

## Recommendation

- **Fastest path:** **Vercel** (Next.js) + **Neon** (Postgres) + **Clerk** + your existing **OllAMA_BASE_URL**.
- **All-in-one:** **Render** (Web Service + Postgres) if you prefer one dashboard and accept cold starts on free tier.
- **More control / learning:** **Railway** or **Fly.io** with external or attached Postgres.

If you tell me which option you prefer (e.g. Vercel, Render, or VPS), I can give step-by-step commands and exact env names for this repo.
