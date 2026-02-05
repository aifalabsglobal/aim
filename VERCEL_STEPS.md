# Vercel deployment – step-by-step

You already have Neon set up and a connection string. Follow these steps in order.

---

## Step 1: Add environment variables in Vercel

1. Go to **[vercel.com](https://vercel.com)** and open your **AimInelligence** project.
2. Click **Settings** (top menu).
3. In the left sidebar, click **Environment Variables**.
4. Add these two variables (one at a time):

   **Variable 1**
   - **Key:** `DATABASE_URL`
   - **Value:** your Neon connection string, e.g.  
     `postgresql://neondb_owner:YOUR_PASSWORD@ep-restless-sea-ai0b9s31-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - **Environments:** tick **Production**, **Preview**, **Development** (or at least Production).
   - Click **Save**.

   **Variable 2**
   - **Key:** `OLLAMA_BASE_URL`
   - **Value:** your Ollama server URL, e.g.  
     `http://45.198.59.91:11434`  
     (use your real GPU server URL if different)
   - **Environments:** same as above.
   - Click **Save**.

5. Confirm both **DATABASE_URL** and **OLLAMA_BASE_URL** appear in the list.

---

## Step 2: Check project settings (Root Directory)

1. In the same project, go to **Settings** → **General**.
2. Find **Root Directory**.
3. Leave it **empty** (or “.”).  
   Do **not** set it to `client`.
4. Save if you changed anything.

---

## Step 3: Deploy

1. Go to the **Deployments** tab.
2. Either:
   - **Option A:** Push your latest code to the connected Git branch (e.g. `main`), and Vercel will build and deploy automatically, or  
   - **Option B:** Click the **⋯** on the latest deployment → **Redeploy** → **Redeploy** (optionally uncheck “Use existing Build Cache” for a clean build).
3. Wait until the deployment status is **Ready** (green).

---

## Step 4: Verify

1. **Frontend**  
   Open: `https://YOUR-PROJECT.vercel.app`  
   You should see the AIFA app (sidebar, input, etc.).

2. **API health**  
   Open: `https://YOUR-PROJECT.vercel.app/api/health`  
   You should see JSON like: `{"status":"ok","timestamp":"..."}`.

3. **Models / GPU**  
   In the app, check the sidebar: under “SELECT MODEL” it should show your models (or “No models available” if Ollama is unreachable).  
   - If you see models: backend is talking to Ollama.  
   - If not: check that **OLLAMA_BASE_URL** is correct and that your Ollama server is reachable from the internet (no firewall blocking Vercel).

4. **Database**  
   In the app, click **+ Start new chat**. If a new conversation appears and you can send a message, the backend is using Neon.

---

## Step 5: If something fails

- **Build failed**  
  Open the deployment → **Building** log. Fix any missing dependencies or script errors (often Node version or `npm install` / `npm run build`).

- **“No models available” / GPU offline**  
  - Confirm **OLLAMA_BASE_URL** in Vercel matches your Ollama URL (no trailing slash).  
  - Ensure the Ollama server is reachable from the internet (try opening `OLLAMA_BASE_URL/api/tags` in a browser or with `curl`).

- **API returns 404 or 500**  
  - Confirm Root Directory is **not** set to `client`.  
  - Confirm **DATABASE_URL** is set and is a valid Postgres URL (starts with `postgresql://`).

- **Database / conversation errors**  
  - Confirm **DATABASE_URL** is the Neon connection string (with password).  
  - In Neon dashboard, check that the project and database exist and are not paused.

---

## Quick checklist

- [ ] **DATABASE_URL** and **OLLAMA_BASE_URL** set in Vercel  
- [ ] Root Directory is empty (repo root)  
- [ ] Latest code pushed (or redeploy triggered)  
- [ ] Deployment is **Ready**  
- [ ] `/api/health` returns `{"status":"ok",...}`  
- [ ] App loads and can create a chat (Neon works)  
- [ ] Models show in sidebar (Ollama reachable)

After that, your backend is running on Vercel with Neon and your own Ollama.
