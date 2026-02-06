# Deploy AIFA with Vercel + Neon

Step-by-step guide to deploy the Next.js app on **Vercel** with **Neon** (PostgreSQL).

---

## 1. Create Neon database

1. Go to **[neon.tech](https://neon.tech)** and sign in (GitHub is fine).
2. **New Project** → name it (e.g. `aifa`) → pick region (closest to you or your users).
3. After creation, open the project and go to **Dashboard** → **Connection string**.
4. Copy the **connection string** (PostgreSQL). It looks like:
   ```txt
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
   Keep this for the next step; you’ll add it to Vercel as `DATABASE_URL`.

---

## 2. Create Vercel project

1. Go to **[vercel.com](https://vercel.com)** and sign in (GitHub recommended).
2. **Add New** → **Project** → import your GitHub repo (`aimintelligence` or your repo name).
3. **Configure Project:**
   - **Root Directory:** click **Edit** → set to **`next-app`** → **Continue**.
   - **Framework Preset:** Next.js (auto).
   - **Build Command:** `npm run build` (default; already runs `prisma generate && next build`).
   - **Output Directory:** leave default.
   - **Install Command:** `npm install` (default).

4. **Environment Variables** (add before first deploy):

   | Name | Value | Environment |
   |------|--------|-------------|
   | `DATABASE_URL` | Your Neon connection string from step 1 | Production, Preview |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk dashboard (see below) | Production, Preview |
   | `CLERK_SECRET_KEY` | From Clerk dashboard | Production, Preview |
   | `OLLAMA_BASE_URL` | `http://45.198.59.91:11434` (or your Ollama URL) | Production, Preview |

5. Click **Deploy**. Wait for the first build to finish (it may fail until migrations are run; see step 4).

---

## 3. Clerk (production URLs)

1. Open **[dashboard.clerk.com](https://dashboard.clerk.com)** → your application.
2. **Configure** → **Domains** (or **Paths** / **Settings** depending on UI):
   - Add your Vercel URL, e.g. `https://your-project.vercel.app`.
   - If you add a custom domain later (e.g. `app.aimlab.in`), add it here too.
3. Use **Production** keys for the live app (or keep test keys for a staging Vercel URL).
4. Copy **Publishable key** and **Secret key** into Vercel env as above.

---

## 4. Run database migrations

Vercel does **not** run migrations automatically. Run them once against your Neon DB:

**Option A – From your machine (recommended)**

1. In `next-app`, create a `.env` (or use a one-off env) with only:
   ```env
   DATABASE_URL="postgresql://...your Neon connection string..."
   ```
2. In a terminal, from the **`next-app`** folder:
   ```bash
   cd next-app
   npx prisma migrate deploy
   ```
3. Optional: seed data:
   ```bash
   npm run db:seed
   ```

**Option B – From Vercel (one-off)**

1. Vercel project → **Settings** → **Environment Variables** → ensure `DATABASE_URL` is set.
2. **Deployments** → open the latest deployment → **Building** tab: build log already ran; you can’t run arbitrary commands there.
3. So use **Option A** for migrations. Option B would require a custom script or CI job that runs `prisma migrate deploy` with Vercel’s env (e.g. GitHub Action).

After migrations, redeploy the app on Vercel (e.g. **Deployments** → **⋯** → **Redeploy**) so the app starts with an up-to-date schema.

---

## 5. Verify

1. Open your Vercel URL (e.g. `https://your-project.vercel.app`).
2. Sign in / sign up (Clerk).
3. Create a conversation and send a message (Ollama must be reachable from the internet at `OLLAMA_BASE_URL`).

---

## 6. Custom domain (optional)

1. Vercel project → **Settings** → **Domains** → add your domain (e.g. `app.aimlab.in`).
2. Follow Vercel’s DNS instructions (A/CNAME).
3. In Clerk, add the same domain so auth works on it.
4. Redeploy if needed.

---

## Checklist

- [ ] Neon project created; connection string copied.
- [ ] Vercel project created with **Root Directory** = `next-app`.
- [ ] All four env vars set on Vercel: `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `OLLAMA_BASE_URL`.
- [ ] Clerk: Vercel (and custom) domain added.
- [ ] Migrations run once: `cd next-app && npx prisma migrate deploy` with production `DATABASE_URL`.
- [ ] First deploy (or redeploy) successful; app loads and chat works.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| Build fails: "Prisma Client not generated" | Ensure **Root Directory** is `next-app` and build runs `prisma generate` (our `package.json` script does). |
| "Environment variable not found: DATABASE_URL" | Set `DATABASE_URL` in Vercel for Production (and Preview if you use preview deployments). |
| Clerk redirect / auth errors | Add the exact Vercel URL (and custom domain) in Clerk → Domains. |
| Chat never answers | Check `OLLAMA_BASE_URL` is reachable from the internet. Vercel runs in the cloud; localhost won’t work. Use a public URL (e.g. `http://45.198.59.91:11434`). |
| DB connection errors in production | Ensure Neon connection string uses `?sslmode=require` and is the **pooled** or **direct** URL from Neon dashboard. |

---

## Quick reference – env vars

```env
# Neon (from Neon dashboard → Connection string)
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# Clerk (from dashboard.clerk.com → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Your Ollama server (must be reachable from Vercel)
OLLAMA_BASE_URL=http://45.198.59.91:11434
```
