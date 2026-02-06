# Using Neon for PostgreSQL

This app uses **Neon** ([neon.tech](https://neon.tech)) for PostgreSQL. Neon is serverless Postgres with a free tier and works well with Vercel.

---

## 1. Create a Neon project

1. Go to **[neon.tech](https://neon.tech)** and sign in (GitHub is fine).
2. Click **New Project**.
3. Name it (e.g. `aifa`) and choose a **region** (closest to you or your Vercel region).
4. Click **Create project**.

---

## 2. Get the connection string

1. In your Neon project, open the **Dashboard**.
2. Go to **Connection details** or **Connection string**.
3. Choose **Pooled connection** (recommended for serverless/Vercel) or **Direct connection** (for local dev and migrations).
4. Copy the connection string. It looks like:
   ```txt
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
   For **pooled** (Vercel), the host may include `-pooler` and use port `6543`:
   ```txt
   postgresql://user:password@ep-xxx-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```

---

## 3. Configure the app

**Local development**

1. In `next-app`, copy the example env:
   ```bash
   cp .env.example .env.local
   ```
2. Paste your Neon connection string into `DATABASE_URL` in `.env.local`.
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
4. Optional – seed data:
   ```bash
   npm run db:seed
   ```
5. Start the app: `npm run dev`.

**Vercel (production)**

1. In your Vercel project → **Settings** → **Environment Variables**.
2. Add `DATABASE_URL` with your Neon connection string.
3. Prefer the **Pooled connection** string from Neon for serverless.
4. Run migrations once from your machine (see [DEPLOY_VERCEL_NEON.md](./DEPLOY_VERCEL_NEON.md)):
   ```bash
   cd next-app
   # Set DATABASE_URL to your Neon URL (e.g. in .env or export)
   npx prisma migrate deploy
   ```

---

## 4. Direct vs pooled connection

| Use case              | Neon connection type | When to use                          |
|-----------------------|----------------------|--------------------------------------|
| Local dev / migrations| **Direct**           | Running Prisma migrate or db seed    |
| Vercel (serverless)   | **Pooled**           | Production; fewer connection limits  |

You can use the same Neon project for both: use the **direct** URL locally and for `prisma migrate deploy`, and the **pooled** URL in Vercel env.

---

## 5. Troubleshooting

- **"Too many connections"** – Use the **Pooled connection** string in Vercel.
- **SSL errors** – Ensure the URL includes `?sslmode=require`.
- **Migrations** – Run `npx prisma migrate deploy` with a `DATABASE_URL` that points at your Neon database (direct or pooled both work for migrations).

For full deploy steps (Vercel + Neon + Clerk + Ollama), see **[DEPLOY_VERCEL_NEON.md](./DEPLOY_VERCEL_NEON.md)**.
