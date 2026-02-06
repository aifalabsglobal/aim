# Create tables in Neon (run migrations)

Tables are **not** created automatically. Run Prisma migrations once against your Neon database.

## Prerequisites

- Neon project created at [neon.tech](https://neon.tech).
- Connection string in `next-app/.env` or `next-app/.env.local` as **`DATABASE_URL`**.

Example:

```env
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
```

Use the **Pooled** connection string from the Neon dashboard for serverless (Vercel). Use **Direct** for local runs if you prefer.

## Create tables (one-time)

From the **`next-app`** directory:

```bash
cd next-app
npx prisma migrate deploy
```

Or from repo root:

```bash
cd next-app && npm run db:migrate
```

This applies the migration that creates:

- **conversations**
- **messages**
- **attachments**

## Verify

- In Neon: **Dashboard** → your project → **Tables** – you should see `conversations`, `messages`, `attachments`.
- Or run: `npx prisma studio` (from `next-app`) to open Prisma Studio and browse the DB.

## After tables exist

- **Vercel:** Set `DATABASE_URL` in the project’s Environment Variables (same Neon connection string, pooled recommended). Redeploy.
- **Local:** Use the same `DATABASE_URL` in `.env.local` and run `npm run dev`.
