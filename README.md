# AIM Intelligence (AIFA)

AI-powered chat application built with **Next.js 16**, **Prisma + PostgreSQL**, **Clerk**, and **Ollama**.

## Repository

[https://github.com/aifalabsglobal/aifaintelli](https://github.com/aifalabsglobal/aifaintelli)

## Features

- **AIFA branding** – Custom typography and warm light/dark theme
- **Chat** – Conversations and messages with streaming responses
- **Ollama** – Connect to your Ollama instance (local or remote)
- **Markdown** – Tables, lists, code blocks (VS Code–style), Mermaid diagrams
- **Auth** – Sign in / sign up via Clerk
- **Deploy** – Vercel + Neon (see `next-app/DEPLOY_VERCEL_NEON.md`)

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL (or use [Neon](https://neon.tech) for a hosted DB)
- [Ollama](https://ollama.com) (local or remote URL)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/aifalabsglobal/aifaintelli.git
   cd aifaintelli
   ```

2. Install and run the app (from repo root):
   ```bash
   cd next-app
   npm install
   cp .env.example .env.local
   # Edit .env.local: DATABASE_URL, Clerk keys, OLLAMA_BASE_URL
   npx prisma migrate deploy
   npm run dev
   ```

   Or from root: `npm run dev` (runs the Next.js app in `next-app`).

3. Open [http://localhost:3000](http://localhost:3000).

### Environment

See **`next-app/.env.example`**. Required:

- `DATABASE_URL` – PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` – from [Clerk](https://dashboard.clerk.com)
- `OLLAMA_BASE_URL` – e.g. `http://localhost:11434` or your remote Ollama URL

## Project structure

- **`next-app/`** – Next.js app (App Router, API routes, Prisma, Clerk)
- **`docs/`** – Implementation notes

## Deployment

Deploy with **Vercel + Neon**:

1. Create a Neon database and add `DATABASE_URL` to Vercel.
2. Create a Vercel project; set **Root Directory** to **`next-app`**.
3. Add env vars (Clerk, `OLLAMA_BASE_URL`).
4. Run migrations once: `cd next-app && npx prisma migrate deploy` with production `DATABASE_URL`.

Full steps: **`next-app/DEPLOY_VERCEL_NEON.md`**.
