# Deploy backend on Vercel (with Ollama on your GPU)

Your Ollama runs on a separate GPU server. This guide gets the **backend API** running on Vercel so the frontend can talk to it and to your Ollama instance.

## 1. Neon database (free)

The backend needs a database. On Vercel we use **Neon** (Postgres) instead of local SQLite.

1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Create a new project and copy the **connection string** (e.g. `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`).

## 2. Vercel environment variables

In your Vercel project: **Settings → Environment Variables**. Add:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Your Neon connection string (starts with `postgresql://`) |
| `OLLAMA_BASE_URL` | Your GPU server Ollama URL (e.g. `http://45.198.59.91:11434` or `https://your-ollama.example.com`) |

Use the same values for Production, Preview, and Development if you want.

## 3. Deploy

- **Root directory:** leave **empty** (use repo root). Do **not** set Root Directory to `client`.
- Push to `main` (or your connected branch). Vercel will:
  1. Run `npm install` (installs server deps for API)
  2. Run `cd client && npm install && npm run build` (builds frontend)
  3. Deploy the frontend and the `api/` serverless functions.

## 4. After deploy

- Frontend: `https://your-project.vercel.app`
- API: `https://your-project.vercel.app/api/health` (should return `{"status":"ok",...}`)
- Models/GPU: the app will call `OLLAMA_BASE_URL` for models and chat.

## 5. CORS and Ollama URL

- The frontend and API are on the same origin (same Vercel project), so CORS is fine.
- Ensure your Ollama server is reachable from the internet (or use a tunnel) and that `OLLAMA_BASE_URL` is correct. If Ollama is behind auth, you’ll need to add that (e.g. proxy or API key) separately.

## File uploads on Vercel

- Uploads currently use `/tmp` on Vercel (ephemeral). Files may not persist between requests.
- For persistent attachments, add **Vercel Blob**: set `BLOB_READ_WRITE_TOKEN` and update the upload/chat flow to store and read files from Blob (see Vercel Blob docs).
