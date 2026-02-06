# Using Neon DB and Clerk Authentication

This app uses **Neon** (PostgreSQL) for the database and **Clerk** for authentication.

---

## Neon (Database)

- **What:** Serverless PostgreSQL hosted at [neon.tech](https://neon.tech).
- **Used for:** Conversations, messages, attachments (via Prisma).
- **Env var:** `DATABASE_URL` – PostgreSQL connection string from Neon.

### Quick setup

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **connection string** (use **Pooled** for Vercel).
3. Set in `.env.local`:
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Run migrations: `npx prisma migrate deploy`.
5. Optional seed: `npm run db:seed`.

See **[NEON_SETUP.md](./NEON_SETUP.md)** for details.

---

## Clerk (Authentication)

- **What:** Auth and user management at [dashboard.clerk.com](https://dashboard.clerk.com).
- **Used for:** Sign in, sign up, user session (SignInButton, SignUpButton, UserButton in the app).
- **Env vars:**
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` – public key (safe in client).
  - `CLERK_SECRET_KEY` – secret key (server only).

### Quick setup

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Go to **API Keys** and copy:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`
3. Set in `.env.local`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
4. For production: add your app URL (e.g. `https://yourapp.vercel.app`) in Clerk → **Domains**.

### Where it’s used in the app

- **`app/layout.tsx`** – `ClerkProvider` wraps the app.
- **`middleware.ts`** – `clerkMiddleware()` runs on routes (including API).
- **`app/page.tsx`** – `SignedIn` / `SignedOut`, `SignInButton`, `SignUpButton`, `UserButton` in the header.

---

## Full `.env.local` example

```env
# Clerk (https://dashboard.clerk.com → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Neon (https://neon.tech → Connection string)
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# Ollama (chat backend)
OLLAMA_BASE_URL=http://localhost:11434
```

Copy from **`.env.example`** and fill in the values. Never commit `.env.local`.

---

## Deploy (Vercel)

For Vercel + Neon + Clerk, set the same four env vars in the Vercel project and add your Vercel URL in Clerk → Domains. See **[DEPLOY_VERCEL_NEON.md](./DEPLOY_VERCEL_NEON.md)**.
