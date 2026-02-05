# Deploy backend on Render

Backend (Express + SQLite) runs on Render. Frontend stays on Vercel and calls the Render API.

## 1. Create Web Service on Render

1. Go to [render.com](https://render.com) → **Dashboard** → **New** → **Web Service**.
2. Connect your GitHub repo `aifalabsglobal/aimintelligence`.
3. Configure:
   - **Name:** `aimintelligence-api` (or any name)
   - **Region:** closest to your Ollama GPU
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js` or `npm start`
   - **Instance Type:** Free (or paid for persistence)

## 2. Environment variables (Render)

In the Render service → **Environment**:

| Key | Value |
|-----|-------|
| `OLLAMA_BASE_URL` | Your Ollama GPU URL (e.g. `http://45.198.59.91:11434`) |

`PORT` is set by Render; no need to add it.

## 3. Frontend (Vercel) – point to Render

In your Vercel project → **Settings** → **Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your Render backend URL (e.g. `https://aimintelligence-api.onrender.com/api`) |

**Important:** Use the full URL including `/api`. The client will use this as the base for all API calls.

Redeploy the Vercel frontend after adding this variable.

## 4. CORS

The backend uses `cors()` with no origin restriction, so requests from www.aimlab.in (Vercel) to your Render URL will be allowed. If you get CORS errors, add explicit origins in `server/app.js`:

```js
app.use(cors({ origin: ['https://www.aimlab.in', 'https://aimlab.in'] }));
```

## 5. Local development

- **Backend:** `cd server && npm run dev` (or `node server.js`)
- **Frontend:** `cd client && npm run dev` (Vite proxy forwards `/api` to `localhost:5000`)
- No `VITE_API_URL` needed locally; the proxy handles `/api`.

## 6. SQLite on Render

Free instances use ephemeral disk; the SQLite file resets on restart. For persistence, use a paid instance with a persistent disk, or switch to a hosted DB (e.g. Neon Postgres) later.
