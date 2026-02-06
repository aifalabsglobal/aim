# AIFA – Next.js App

AI chat app built with **Next.js 16**, **Neon** (PostgreSQL), **Clerk** (auth), and **Ollama**.

## Stack

- **Database:** [Neon](https://neon.tech) (PostgreSQL) via Prisma
- **Auth:** [Clerk](https://clerk.com) (sign in, sign up, session)
- **AI:** [Ollama](https://ollama.com) (remote URL)

## Getting started

1. **Install:** `npm install`
2. **Env:** Copy `.env.example` to `.env.local` and set:
   - **Neon:** `DATABASE_URL` from [neon.tech](https://neon.tech) → Connection string
   - **Clerk:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys
   - **Ollama:** `OLLAMA_BASE_URL` (e.g. `http://localhost:11434`)
3. **DB:** `npx prisma migrate deploy` then optional `npm run db:seed`
4. **Run:** `npm run dev` → [http://localhost:3000](http://localhost:3000)

See **[SETUP_NEON_CLERK.md](./SETUP_NEON_CLERK.md)** for Neon and Clerk setup.  
See **[DEPLOY_VERCEL_NEON.md](./DEPLOY_VERCEL_NEON.md)** for Vercel deploy.

## Scripts

- `npm run dev` – development
- `npm run build` – build (runs `prisma generate && next build`)
- `npm start` – production
- `npm run db:seed` – seed database
- `npm run db:studio` – Prisma Studio
